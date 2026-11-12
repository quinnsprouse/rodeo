import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { lex } from "./shell-lexer.mjs";
import {
  baseName,
  expandHome,
  isFlag,
  resolveCommand,
  resolveWithExecs,
} from "./simple-command.mjs";

const MAX_DEPTH = 5;
const MAX_SCRIPT_BYTES = 256 * 1024;
const SHELLS = new Set(["sh", "bash", "zsh"]);
const SHELL_VALUE_OPTIONS = new Set(["-o", "+o", "-O", "+O", "--rcfile", "--init-file"]);
const ECHO_FLAGS = /^-[neE]+$/;
const PRINTF_CONVERSION = /%(?:%|[-+ #0]*\d*(?:\.\d*)?[a-zA-Z])/g;
const OUTPUT_ESCAPES = new Map([
  ["n", "\n"],
  ["t", "\t"],
  ["\\", "\\"],
]);
const UNREADABLE = Symbol("unreadable script");

function readScriptFile(path) {
  try {
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats?.isFile() || stats.size > MAX_SCRIPT_BYTES) return null;
    const content = readFileSync(path);
    return content.includes(0) ? null : content.toString("utf8");
  } catch {
    return null;
  }
}

export function scriptReader(cwd) {
  const seen = new Set();
  return (word) => {
    const path = resolve(cwd, expandHome(word));
    if (seen.has(path)) return null;
    seen.add(path);
    return readScriptFile(path);
  };
}

function shellInvocation(args) {
  let letters = "";
  for (let index = 0; index < args.length; index++) {
    const word = args[index];
    if (word.quoted || !/^[-+]/.test(word.text)) return { letters, operand: word };
    if (word.text === "-" || word.text === "--") return { letters, operand: args[index + 1] };
    if (SHELL_VALUE_OPTIONS.has(word.text)) index++;
    else if (/^-[^-]/.test(word.text)) letters += word.text.slice(1);
  }
  return { letters, operand: undefined };
}

function unescapeOutput(text) {
  return text.replace(/\\([\\nt])/g, (sequence, letter) => OUTPUT_ESCAPES.get(letter) ?? sequence);
}

function echoOutput(args) {
  const start = args.findIndex((word) => word.quoted || !ECHO_FLAGS.test(word.text));
  const words = start === -1 ? [] : args.slice(start);
  return unescapeOutput(words.map((word) => word.text).join(" "));
}

function printfOutput(args) {
  const [format = "", ...values] = (args[0]?.text === "--" ? args.slice(1) : args).map(
    (word) => word.text,
  );
  const conversions = (format.match(PRINTF_CONVERSION) ?? []).filter((match) => match !== "%%");
  const passes =
    conversions.length === 0 ? 1 : Math.max(1, Math.ceil(values.length / conversions.length));
  const queue = [...values];
  const output = Array.from({ length: passes }, () =>
    format.replace(PRINTF_CONVERSION, (match) => (match === "%%" ? "%" : (queue.shift() ?? ""))),
  );
  return unescapeOutput(output.join(""));
}

function scriptFrom(word, readScript) {
  if (word.text.startsWith("<(")) return [UNREADABLE];
  if (word.runtime || /[$`]/.test(word.text)) return [];
  const text = readScript(word);
  return text === null ? [] : [text];
}

function shebangProgram(text) {
  const [interpreter, ...rest] = text.split("\n", 1)[0].slice(2).trim().split(/\s+/);
  const program = baseName(interpreter);
  return program === "env" ? rest.find((word) => !word.startsWith("-")) : program;
}

function executableScript(word, readScript) {
  const extension = /.\.([^.]+)$/.exec(baseName(word.text))?.[1];
  if (extension !== undefined && !SHELLS.has(extension)) return [];
  const [text] = scriptFrom(word, readScript);
  if (typeof text !== "string") return [];
  const shellScript =
    extension !== undefined || (text.startsWith("#!") && SHELLS.has(shebangProgram(text)));
  return shellScript ? [text] : [];
}

function stdinScript({ stdinFiles, pipedFrom }, readScript) {
  if (stdinFiles.length > 0) return stdinFiles.flatMap((word) => scriptFrom(word, readScript));
  return pipedFrom === null ? [] : pipedScript(resolveCommand(pipedFrom), readScript);
}

function pipedScript(producer, readScript) {
  const { program, args, inputs } = producer;
  if (program === "echo") return [echoOutput(args)];
  if (program === "printf") return [printfOutput(args)];
  if (program !== "cat") return [UNREADABLE];
  const files = args.filter((word) => !isFlag(word));
  if (files.length > 0) return files.flatMap((word) => scriptFrom(word, readScript));
  return inputs.length > 0 ? inputs : stdinScript(producer, readScript);
}

function shellScripts(command, readScript) {
  const { args, inputs } = command;
  const { letters, operand } = shellInvocation(args);
  if (letters.includes("c")) return operand === undefined ? inputs : [...inputs, operand.text];
  if (letters.includes("n")) return inputs;
  if (operand !== undefined && !letters.includes("s")) {
    return [...inputs, ...scriptFrom(operand, readScript)];
  }
  return inputs.length > 0 ? inputs : stdinScript(command, readScript);
}

function nestedScripts(command, readScript) {
  const { program, args, executable } = command;
  if (program === "eval") return [args.map((word) => word.text).join(" ")];
  if (program === "source" || program === ".") {
    return args.length > 0 ? scriptFrom(args[0], readScript) : [];
  }
  if (SHELLS.has(program)) return shellScripts(command, readScript);
  return executable?.text.includes("/") ? executableScript(executable, readScript) : [];
}

function withNestedScripts(command, readScript) {
  const scripts = nestedScripts(command, readScript);
  return {
    command: { ...command, runsUnreadableScript: scripts.includes(UNREADABLE) },
    scripts: scripts.filter((script) => script !== UNREADABLE),
  };
}

export function simpleCommands(script, readScript = () => null, depth = 0) {
  if (depth > MAX_DEPTH) return [];
  const { commands, scripts } = lex(script);
  const expanded = commands
    .flatMap(resolveWithExecs)
    .map((command) => withNestedScripts(command, readScript));
  const nested = [...scripts, ...expanded.flatMap((entry) => entry.scripts)];
  return [
    ...expanded.map((entry) => entry.command),
    ...nested.flatMap((inner) => simpleCommands(inner, readScript, depth + 1)),
  ];
}
