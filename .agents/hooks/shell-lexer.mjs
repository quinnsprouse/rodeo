const DESCRIPTOR = /^\d+$/;
const DELIMITER_END = /[\s;&|()<>]/;
const DOUBLE_QUOTE_ESCAPES = new Set(["$", "`", '"', "\\"]);
const REDIRECTIONS = ["<<<", "<<-", "<<", "&>>", "&>", ">>", ">|", ">&", "<&", "<>", ">", "<"];

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

function redirectKind(operator, descriptor) {
  if (operator === "<<<") return "herestring";
  const readsStdin = (operator === "<" || operator === "<>") && (descriptor ?? "0") === "0";
  return readsStdin ? "stdin" : "file";
}

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

export function lex(script) {
  const lexer = new ShellLexer(script.replaceAll("\r\n", "\n")).run();
  return {
    commands: lexer.commands.filter((command) => command.words.length > 0),
    scripts: lexer.scripts,
  };
}
