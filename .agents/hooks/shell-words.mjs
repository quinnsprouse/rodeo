const MAX_DEPTH = 5;
const SHELLS = new Set(["sh", "bash", "zsh"]);
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
const SHELL_VALUE_OPTIONS = new Set(["-o", "+o", "-O", "+O", "--rcfile", "--init-file"]);
const FIND_EXEC_ACTIONS = new Set(["-exec", "-execdir", "-ok", "-okdir"]);
const DECLARATIONS = new Set(["export", "declare", "typeset", "local", "readonly"]);
const ASSIGNMENT = /^([A-Za-z_]\w*)=(.*)$/s;
const DESCRIPTOR = /^\d+$/;
const DELIMITER_END = /[\s;&|()<>]/;
const DOUBLE_QUOTE_ESCAPES = new Set(["$", "`", '"', "\\"]);
const REDIRECTIONS = ["<<<", "<<-", "<<", "&>>", "&>", ">>", ">|", ">&", "<&", "<>", ">", "<"];
const ECHO_FLAGS = /^-[neE]+$/;
const PRINTF_CONVERSION = /%(?:%|[-+ #0]*\d*(?:\.\d*)?[a-zA-Z])/g;
const OUTPUT_ESCAPES = new Map([
  ["n", "\n"],
  ["t", "\t"],
  ["\\", "\\"],
]);
const RUNTIME_WORD = { text: "", quoted: true, runtime: true };
const UNREADABLE = Symbol("unreadable script");

const HANDLERS = new Map([
  [" ", "blank"],
  ["\t", "blank"],
  ["\n", "newline"],
  [";", "separator"],
  ["|", "pipe"],
  ["&", "ampersand"],
  ["(", "openParen"],
  [")", "closeParen"],
  ["<", "angle"],
  [">", "angle"],
  ["'", "singleQuote"],
  ['"', "doubleQuote"],
  ["\\", "backslash"],
  ["$", "dollar"],
  ["`", "backtick"],
  ["#", "hash"],
]);

class ShellLexer {
  constructor(source, start = 0, nested = false) {
    this.source = source;
    this.index = start;
    this.nested = nested;
    this.parens = 0;
    this.commands = [];
    this.scripts = [];
    this.heredocs = [];
    this.word = null;
    this.redirect = null;
    this.startCommand();
  }

  run() {
    while (this.index < this.source.length && !this.atClose()) {
      const handler = HANDLERS.get(this.source[this.index]);
      if (handler) this[handler]();
      else this.literal();
    }
    this.closeAt = this.index;
    this.endCommand();
    return this;
  }

  atClose() {
    return this.nested && this.parens === 0 && this.source[this.index] === ")";
  }

  startCommand() {
    this.command = { words: [], inputs: [], stdinFiles: [], pipedFrom: null };
    this.commands.push(this.command);
  }

  append(text, quoted = false) {
    this.word ??= { text: "", quoted };
    this.word.text += text;
  }

  endWord() {
    if (!this.word) return;
    if (this.redirect === "herestring") this.command.inputs.push(this.word.text);
    else if (this.redirect === "stdin") this.command.stdinFiles.push(this.word);
    else if (this.redirect === null) this.command.words.push(this.word);
    this.word = null;
    this.redirect = null;
  }

  endCommand() {
    this.endWord();
    this.redirect = null;
    this.startCommand();
  }

  literal() {
    this.append(this.source[this.index]);
    this.index++;
  }

  blank() {
    this.endWord();
    this.index++;
  }

  newline() {
    if (!this.continuesPipeline()) this.endCommand();
    this.index++;
    this.readHeredocBodies();
  }

  continuesPipeline() {
    return this.word === null && this.command.words.length === 0 && this.command.pipedFrom !== null;
  }

  separator() {
    this.endCommand();
    this.index++;
  }

  pipe() {
    const producer = this.command;
    const orList = this.source[this.index + 1] === "|";
    this.endCommand();
    if (!orList) this.command.pipedFrom = producer;
    this.index += orList || this.source[this.index + 1] === "&" ? 2 : 1;
  }

  ampersand() {
    if (this.source[this.index + 1] === ">") this.redirection();
    else this.separator();
  }

  openParen() {
    if (this.nested) this.parens++;
    this.separator();
  }

  closeParen() {
    if (this.nested) this.parens--;
    this.separator();
  }

  angle() {
    if (this.source[this.index + 1] === "(") this.append(this.readSubstitution());
    else this.redirection();
  }

  redirection() {
    const descriptor =
      this.word && !this.word.quoted && DESCRIPTOR.test(this.word.text) ? this.word.text : null;
    if (descriptor === null) this.endWord();
    else this.word = null;
    const operator = REDIRECTIONS.find((candidate) =>
      this.source.startsWith(candidate, this.index),
    );
    this.index += operator.length;
    if (operator === "<<" || operator === "<<-") this.readHeredocOperator(operator === "<<-");
    else this.redirect = redirectKind(operator, descriptor);
  }

  singleQuote() {
    const close = this.source.indexOf("'", this.index + 1);
    const end = close === -1 ? this.source.length : close;
    this.append(this.source.slice(this.index + 1, end), true);
    this.index = end + 1;
  }

  doubleQuote() {
    this.index++;
    this.append(this.readExpanding('"'), true);
  }

  backslash() {
    const next = this.source[this.index + 1] ?? "";
    this.index += 2;
    if (next !== "\n") this.append(next);
  }

  dollar() {
    const next = this.source[this.index + 1];
    if (next === "(") {
      this.append(this.readSubstitution());
    } else if (next === "{") {
      this.append(this.readBraced());
    } else if (next === "'") {
      this.index += 2;
      this.append(this.readAnsiC(), true);
    } else if (next === '"') {
      this.index += 2;
      this.append(this.readExpanding('"'), true);
    } else {
      this.literal();
    }
  }

  backtick() {
    this.append(this.readBackticks());
  }

  hash() {
    if (this.word) {
      this.literal();
      return;
    }
    const newline = this.source.indexOf("\n", this.index);
    this.index = newline === -1 ? this.source.length : newline;
  }

  readExpanding(terminator) {
    let text = "";
    while (this.index < this.source.length && this.source[this.index] !== terminator) {
      text += this.readExpandingPiece();
    }
    this.index++;
    return text;
  }

  readExpandingPiece() {
    const char = this.source[this.index];
    if (char === "`") return this.readBackticks();
    if (char === "$" && this.source[this.index + 1] === "(") return this.readSubstitution();
    this.index++;
    if (char !== "\\") return char;
    const next = this.source[this.index] ?? "";
    this.index++;
    if (next === "\n") return "";
    return DOUBLE_QUOTE_ESCAPES.has(next) ? next : char + next;
  }

  readSubstitution() {
    const open = this.index;
    const inner = new ShellLexer(this.source, open + 2, true).run();
    this.scripts.push(this.source.slice(open + 2, inner.closeAt));
    this.index = Math.min(inner.closeAt + 1, this.source.length);
    return this.source.slice(open, this.index);
  }

  readBackticks() {
    const open = this.index;
    let script = "";
    this.index++;
    while (this.index < this.source.length && this.source[this.index] !== "`") {
      const char = this.source[this.index];
      const next = this.source[this.index + 1] ?? "";
      const escaped = char === "\\" && ["`", "\\", "$"].includes(next);
      script += escaped ? next : char;
      this.index += escaped ? 2 : 1;
    }
    this.index++;
    this.scripts.push(script);
    return this.source.slice(open, this.index);
  }

  readBraced() {
    const close = this.source.indexOf("}", this.index + 2);
    const end = close === -1 ? this.source.length : close + 1;
    const text = this.source.slice(this.index, end);
    this.index = end;
    return text;
  }

  readAnsiC() {
    let text = "";
    while (this.index < this.source.length && this.source[this.index] !== "'") {
      const escaped = this.source[this.index] === "\\";
      text += this.source[this.index + (escaped ? 1 : 0)] ?? "";
      this.index += escaped ? 2 : 1;
    }
    this.index++;
    return text;
  }

  readHeredocOperator(stripTabs) {
    while (this.source[this.index] === " " || this.source[this.index] === "\t") this.index++;
    let delimiter = "";
    let quoted = false;
    while (this.index < this.source.length && !DELIMITER_END.test(this.source[this.index])) {
      const char = this.source[this.index];
      quoted ||= char === "'" || char === '"' || char === "\\";
      delimiter += this.readDelimiterPiece(char);
    }
    this.heredocs.push({ delimiter, stripTabs, expands: !quoted, command: this.command });
  }

  readDelimiterPiece(char) {
    if (char === "\\") {
      this.index += 2;
      return this.source[this.index - 1] ?? "";
    }
    if (char !== "'" && char !== '"') {
      this.index++;
      return char;
    }
    const close = this.source.indexOf(char, this.index + 1);
    const end = close === -1 ? this.source.length : close;
    const text = this.source.slice(this.index + 1, end);
    this.index = end + 1;
    return text;
  }

  readHeredocBodies() {
    for (const heredoc of this.heredocs.splice(0)) {
      const body = this.readHeredocBody(heredoc);
      heredoc.command.inputs.push(body);
      if (heredoc.expands) this.scripts.push(...expansionsIn(body));
    }
  }

  readHeredocBody({ delimiter, stripTabs }) {
    const lines = [];
    while (this.index < this.source.length) {
      const newline = this.source.indexOf("\n", this.index);
      const end = newline === -1 ? this.source.length : newline;
      const line = this.source.slice(this.index, end);
      this.index = end + 1;
      if ((stripTabs ? line.replace(/^\t+/, "") : line) === delimiter) break;
      lines.push(line);
    }
    return lines.join("\n");
  }
}

function expansionsIn(body) {
  const lexer = new ShellLexer(body);
  lexer.readExpanding(null);
  return lexer.scripts;
}

function lex(script) {
  const lexer = new ShellLexer(script.replaceAll("\r\n", "\n")).run();
  return {
    commands: lexer.commands.filter((command) => command.words.length > 0),
    scripts: lexer.scripts,
  };
}

export function isFlag(word) {
  return !word.quoted && word.text.length > 1 && word.text.startsWith("-");
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

function redirectKind(operator, descriptor) {
  if (operator === "<<<") return "herestring";
  const readsStdin = (operator === "<" || operator === "<>") && (descriptor ?? "0") === "0";
  return readsStdin ? "stdin" : "file";
}

function baseName(path) {
  return path.slice(path.lastIndexOf("/") + 1);
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

function resolveCommand({ words, inputs = [], stdinFiles = [], pipedFrom = null }) {
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

function resolveWithExecs(rawCommand) {
  const command = resolveCommand(rawCommand);
  if (command.program !== "find") return [command];
  return [command, ...findExecs(command.args).map(resolveCommand)];
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
