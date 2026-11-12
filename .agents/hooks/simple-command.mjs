import { homedir } from "node:os";
import { join } from "node:path";

const WRAPPERS = new Set([
  "!",
  "{",
  "if",
  "then",
  "else",
  "elif",
  "do",
  "while",
  "until",
  "time",
  "command",
  "exec",
  "env",
  "sudo",
  "nohup",
  "xargs",
]);
const WRAPPER_VALUE_FLAGS = new Map([
  ["env", new Set(["-u", "-C", "--unset", "--chdir"])],
  ["sudo", new Set(["-u", "-g", "-C", "-D", "-h", "-p", "-r", "-t", "-T", "-U"])],
  ["exec", new Set(["-a"])],
  ["time", new Set(["-f", "-o"])],
  [
    "xargs",
    new Set([
      "-I",
      "-J",
      "-L",
      "-P",
      "-R",
      "-S",
      "-E",
      "-a",
      "-d",
      "-n",
      "-s",
      "--arg-file",
      "--delimiter",
      "--max-args",
      "--max-chars",
      "--max-lines",
      "--max-procs",
      "--process-slot-var",
    ]),
  ],
]);
const XARGS_REPLACE = /^(?:-[IJ]|-i|--replace=?)(.*)$/s;
const FIND_EXEC_ACTIONS = new Set(["-exec", "-execdir", "-ok", "-okdir"]);
const DECLARATIONS = new Set(["export", "declare", "typeset", "local", "readonly"]);
const ASSIGNMENT = /^([A-Za-z_]\w*)=(.*)$/s;
const RUNTIME_WORD = { text: "", quoted: true, runtime: true };

const NO_VALUE_FLAGS = new Set();

export function isFlag(word) {
  return !word.quoted && word.text.length > 1 && word.text.startsWith("-");
}

export function expandHome(word) {
  if (word.quoted || !(word.text === "~" || word.text.startsWith("~/"))) return word.text;
  return join(homedir(), word.text.slice(1));
}

export function baseName(path) {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function parseArgs(args, valueFlags = NO_VALUE_FLAGS) {
  const flags = [];
  const operands = [];
  for (let index = 0; index < args.length; index++) {
    const word = args[index];
    if (!word.quoted && word.text === "--") {
      return { flags, operands, afterDashes: args.slice(index + 1) };
    }
    if (!isFlag(word)) {
      operands.push(word);
      continue;
    }
    flags.push(word.text);
    if (valueFlags.has(word.text)) index++;
  }
  return { flags, operands, afterDashes: null };
}

function shortLetters(flag, valueLetters) {
  if (flag.startsWith("--")) return new Set();
  const letters = Array.from(flag.slice(1));
  const takesValue = new Set(valueLetters);
  const valueAt = letters.findIndex((letter) => takesValue.has(letter));
  return new Set(valueAt === -1 ? letters : letters.slice(0, valueAt + 1));
}

export function hasShort(flags, letter, valueLetters = "") {
  return flags.some((flag) => shortLetters(flag, valueLetters).has(letter));
}

function asAssignment(word) {
  const match = word.quoted ? null : ASSIGNMENT.exec(word.text);
  return match ? { name: match[1], value: match[2] } : null;
}

function skipWrapperOptions(words, start, wrapper) {
  const valueFlags = WRAPPER_VALUE_FLAGS.get(wrapper) ?? new Set();
  let index = start;
  while (index < words.length && isFlag(words[index])) {
    const flag = words[index].text;
    index += valueFlags.has(flag) ? 2 : 1;
    if (flag === "--") break;
  }
  return index;
}

function asRuntime(word) {
  return { ...word, runtime: true };
}

function xargsReplaceString(options) {
  let replace = null;
  for (let index = 0; index < options.length; index++) {
    const { text } = options[index];
    const match = XARGS_REPLACE.exec(text);
    if (match === null) continue;
    const separateValue = text === "-I" || text === "-J";
    replace = separateValue ? (options[index + 1]?.text ?? null) : match[1] || "{}";
  }
  return replace;
}

function fedByXargs(command, options) {
  const replace = xargsReplaceString(options);
  const args = replace
    ? command.args.map((word) => (word.text.includes(replace) ? asRuntime(word) : word))
    : [...command.args, RUNTIME_WORD];
  return { ...command, args, inputs: [], stdinFiles: [], pipedFrom: null };
}

export function resolveCommand({ words, inputs = [], stdinFiles = [], pipedFrom = null }) {
  const assignments = [];
  let xargsOptions = null;
  let index = 0;
  while (index < words.length) {
    const word = words[index];
    const assignment = asAssignment(word);
    if (assignment) assignments.push(assignment);
    else if (!WRAPPERS.has(word.text)) break;
    const next = assignment ? index + 1 : skipWrapperOptions(words, index + 1, word.text);
    if (word.text === "xargs") xargsOptions = words.slice(index + 1, next);
    index = next;
  }
  const executable = words[index];
  const program = baseName(executable?.text ?? "");
  const args = words.slice(index + 1);
  if (DECLARATIONS.has(program)) {
    assignments.push(...args.map(asAssignment).filter((assignment) => assignment !== null));
  }
  const command = { assignments, program, executable, args, inputs, stdinFiles, pipedFrom };
  return xargsOptions === null ? command : fedByXargs(command, xargsOptions);
}

function endsFindExec(word, words) {
  return word.text === ";" || (word.text === "+" && words.at(-1)?.text === "{}");
}

function findExecs(args) {
  const execs = [];
  let words = null;
  for (const word of args) {
    if (words === null) {
      words = FIND_EXEC_ACTIONS.has(word.text) ? [] : null;
    } else if (endsFindExec(word, words)) {
      execs.push({ words });
      words = null;
    } else {
      words.push(word.text.includes("{}") ? asRuntime(word) : word);
    }
  }
  return words === null ? execs : [...execs, { words }];
}

export function resolveWithExecs(rawCommand) {
  const command = resolveCommand(rawCommand);
  if (command.program !== "find") return [command];
  return [command, ...findExecs(command.args).map(resolveCommand)];
}
