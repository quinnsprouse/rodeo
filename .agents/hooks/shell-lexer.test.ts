import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vite-plus/test";
import * as z from "zod/mini";

import { lex } from "./shell-lexer.mjs";

type Difference = { source: string; shell: string[][]; lexer: string[][] };

const home = "/home/lexer";
const shellEnv = { PATH: "/nonexistent", LC_ALL: "C", HOME: home, NAME: "value", SPACED: "a b" };

const sameWords = {
  "single quotes": [String.raw`'a b'`, `'a"b'`, String.raw`'a\b'`, "'a\nb'", "'a;b' 'c|d' '(e)'"],
  "double quotes": [
    `"a b"`,
    `"a'b"`,
    String.raw`"a\"b"`,
    String.raw`"a\\b"`,
    String.raw`"a\b"`,
    String.raw`"a\$b"`,
    '"a\nb"',
    `"a$" "$"`,
    `"a && b" "<c>"`,
  ],
  backslashes: [
    String.raw`a\ b`,
    String.raw`a\\b`,
    String.raw`\' \"`,
    String.raw`\a \$x`,
    String.raw`a\;b \| \& \(`,
    "a\\\tb",
  ],
  "adjacent quoted parts": [`a'b'"c"d`, `'a'"b"`, `"a"'b'c`, "''#x"],
  "empty strings": ["", "''", `""`, `'' ""`, "a''b", `a""b`],
  blanks: ["  a   b  ", "a\tb", "\ta\t"],
  comments: ["a # b c", "a#b", "'#' b", `"#" b`, String.raw`\# b`, "# only a comment"],
  "line continuations": ["a\\\nb", "a \\\nb", '"a\\\nb"', "'a\\\nb'"],
  "characters with no special meaning in a word": [
    "a=b",
    "-n --flag",
    "* ? [a]",
    "x{y} !",
    "% @:,.+",
  ],
};

const ansiCProbe = "$'x'";
const ansiCWords = ["$'a b'", "a$'b'c", String.raw`$'a\\b'`, "$''", "$'a;b'"];

const expansions: Difference[] = [
  { source: "$NAME", shell: [["value"]], lexer: [["$NAME"]] },
  { source: `"$NAME"`, shell: [["value"]], lexer: [["$NAME"]] },
  { source: "${NAME}", shell: [["value"]], lexer: [["${NAME}"]] },
  { source: "$SPACED", shell: [["a", "b"]], lexer: [["$SPACED"]] },
  { source: "a $UNSET b", shell: [["a", "b"]], lexer: [["a", "$UNSET", "b"]] },
  { source: `"$UNSET"`, shell: [[""]], lexer: [["$UNSET"]] },
  { source: "~", shell: [[home]], lexer: [["~"]] },
  { source: "~/x", shell: [[`${home}/x`]], lexer: [["~/x"]] },
];

const ansiCEscapes: Difference[] = [
  { source: String.raw`$'a\tb'`, shell: [["a\tb"]], lexer: [["atb"]] },
  { source: String.raw`$'a\nb'`, shell: [["a\nb"]], lexer: [["anb"]] },
];

const corpus = [
  ...Object.values(sameWords).flat(),
  ansiCProbe,
  ...ansiCWords,
  ...[...expansions, ...ansiCEscapes].map(({ source }) => source),
];

function unquotedText(source: string) {
  let text = "";
  let quote = "";
  for (let index = 0; index < source.length; index++) {
    const char = source[index] ?? "";
    const escapes = char === "\\" && quote !== "'";
    if (escapes && index === source.length - 1) return null;
    if (escapes) index++;
    else if (quote !== "") quote = char === quote ? "" : quote;
    else if (char === "'" || char === '"') quote = char;
    else text += char;
  }
  return quote === "" ? text : null;
}

function safeForShell(source: string) {
  const unquoted = unquotedText(source);
  return (
    unquoted !== null &&
    !/`|\$\(|\$\[|\$\{(?![A-Za-z_]\w*\})/.test(source) &&
    !/[<>|;&()\n]/.test(unquoted) &&
    !(unquoted.includes("#") && source.includes("\n"))
  );
}

const unsafe = corpus.filter((source) => !safeForShell(source));
if (unsafe.length > 0) {
  throw new Error(
    `sh must not run these corpus entries, which are not plain words: ${unsafe.join(", ")}`,
  );
}

function wordsFromShell() {
  const report = String.raw`report() { printf '%s' "$#"; for word in "$@"; do printf '\037%s' "$word"; done; printf '\036'; }`;
  const script = ["set -f", report, ...corpus.map((source) => `set -- ${source}\nreport "$@"`)];
  const result = spawnSync("/bin/sh", ["-c", script.join("\n")], {
    cwd: tmpdir(),
    env: shellEnv,
    encoding: "utf8",
  });
  const records = result.stdout.split("\u001e").slice(0, -1);
  if (result.status !== 0 || records.length !== corpus.length) {
    throw new Error(`sh read ${records.length} of ${corpus.length} entries: ${result.stderr}`);
  }
  return new Map(
    records.map((record, position) => {
      const [, ...words] = record.split("\u001f");
      return [corpus[position], words.length === 0 ? [] : [words]];
    }),
  );
}

const fromShell = wordsFromShell();
const shellReadsAnsiC = fromShell.get(ansiCProbe)?.[0]?.[0] === "x";
const lexedCommands = z.array(z.object({ words: z.array(z.object({ text: z.string() })) }));

function fromLexer(source: string) {
  return lexedCommands
    .parse(lex(source).commands)
    .map(({ words }) => words.map(({ text }) => text));
}

function compared(sources: string[]) {
  return {
    lexer: sources.map((source) => [source, fromLexer(source)]),
    shell: sources.map((source) => [source, fromShell.get(source)]),
  };
}

function differences(cases: Difference[]) {
  return {
    actual: cases.map(({ source }) => ({
      source,
      shell: fromShell.get(source),
      lexer: fromLexer(source),
    })),
    expected: cases,
  };
}

describe("shell lexer", () => {
  it.for(Object.entries(sameWords))("splits words with %s the way sh does", ([, sources]) => {
    const { lexer, shell } = compared(sources);
    expect(lexer).toEqual(shell);
  });

  it("keeps parameter and tilde expansions as text where sh expands them", () => {
    const { actual, expected } = differences(expansions);
    expect(actual).toEqual(expected);
  });

  it.runIf(shellReadsAnsiC)("reads ANSI-C quotes the way sh does", () => {
    const { lexer, shell } = compared(ansiCWords);
    expect(lexer).toEqual(shell);
  });

  it.runIf(shellReadsAnsiC)(
    "drops the backslash of an ANSI-C escape instead of decoding it",
    () => {
      const { actual, expected } = differences(ansiCEscapes);
      expect(actual).toEqual(expected);
    },
  );
});
