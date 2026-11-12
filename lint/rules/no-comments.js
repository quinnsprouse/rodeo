import { readFileSync } from "node:fs";

import { defineRule } from "vite-plus/lint/plugins";

import { DISABLE_DIRECTIVE } from "./no-disable-directives.js";

const GENERIC_PACKAGE_WORDS = new Set([
  "analytics",
  "animate",
  "api",
  "app",
  "auth",
  "authority",
  "base",
  "cache",
  "class",
  "cli",
  "client",
  "common",
  "compiler",
  "components",
  "config",
  "conventional",
  "core",
  "data",
  "date",
  "dev",
  "devtools",
  "doctor",
  "env",
  "event",
  "fast",
  "fetch",
  "file",
  "font",
  "form",
  "format",
  "free",
  "hook",
  "hooks",
  "icon",
  "icons",
  "kit",
  "library",
  "lint",
  "lite",
  "loader",
  "markdown",
  "mono",
  "native",
  "next",
  "parser",
  "path",
  "plugin",
  "plus",
  "preset",
  "pro",
  "query",
  "router",
  "runtime",
  "sdk",
  "server",
  "shared",
  "simple",
  "start",
  "state",
  "store",
  "stream",
  "style",
  "table",
  "test",
  "testing",
  "theme",
  "time",
  "tools",
  "type",
  "types",
  "user",
  "utils",
  "variable",
  "variance",
  "virtual",
  "web",
]);
const MIN_DEPENDENCY_WORD_LENGTH = 3;
const WHY_MARKER = /^why:/;

function dependencyCauses() {
  const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const names = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
  return names
    .flatMap((name) => name.replace(/^@/, "").split(/[/-]/))
    .filter(
      (word) => word.length >= MIN_DEPENDENCY_WORD_LENGTH && !GENERIC_PACKAGE_WORDS.has(word),
    );
}

function causeAlternative(cause) {
  return cause.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll(" ", "[\\s-]?");
}

function outsideCausePattern(knownCauses) {
  const names = [...new Set([...dependencyCauses(), ...knownCauses])];
  return new RegExp(String.raw`\b(?:${names.map(causeAlternative).join("|")})(?:s|\d+)?\b`, "i");
}

function commentText(comment) {
  return comment.value
    .split("\n")
    .map((line) => line.replace(/^\s*\*?/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function commentGroups(comments) {
  const groups = [];
  for (const comment of comments) {
    const previous = groups.at(-1)?.at(-1);
    const continuesLineComment =
      previous?.type === "Line" &&
      comment.type === "Line" &&
      comment.loc.start.line === previous.loc.end.line + 1;
    if (continuesLineComment) groups.at(-1).push(comment);
    else groups.push([comment]);
  }
  return groups;
}

function isGovernedElsewhere(text) {
  return DISABLE_DIRECTIVE.test(text) || text.startsWith("@ts-");
}

export function noComments({ defaultOptions, knownCauses }) {
  const outsideCause = outsideCausePattern(knownCauses);
  return defineRule({
    meta: {
      type: "problem",
      docs: {
        description:
          "Ban code comments. Agents copy comments, so a workaround note spreads. The code must say what it does. A `why:` comment is a last resort for a cause outside the code that already tripped an agent.",
      },
      messages: {
        comment:
          "Comments are not allowed. Make the code say it: a clearer name, a smaller function, a type, or a test. Delete a comment that restates the code, and fix a workaround instead of explaining it. If a test fails when someone undoes the code, the test already explains it. A `why:` comment is a last resort for code an agent already got wrong because of a library, browser, or spec. See docs/agents/LINT_RULES.md#comments",
        reason:
          "A `why:` comment needs a reason of at least {{min}} words that names the cause outside the code. If you cannot name one, delete the comment.",
        length:
          "A `why:` comment in this file is {{min}} to {{max}} words: the cause outside the code and what breaks without this code. Cut it to that, or delete it.",
        cause:
          "This `why:` comment names no cause outside the code. Name the dependency, browser, or spec that forces this code, such as TanStack Router or Safari. If the cause is real but lint does not know its name, add the name to the matching group in KNOWN_CAUSES in lint/rules.js. If the cause is in this repo, fix the code instead and delete the comment.",
      },
      schema: [
        {
          type: "object",
          properties: {
            cause: { enum: ["optional", "required"] },
            minWords: { type: "integer", minimum: 1 },
            maxWords: { type: "integer", minimum: 1 },
          },
          required: ["cause", "minWords"],
          additionalProperties: false,
        },
      ],
    },
    create(context) {
      const { cause, minWords, maxWords } = context.options[0] ?? defaultOptions;
      function reasonProblem(reason) {
        const words = reason.split(/\s+/).length;
        if (maxWords === undefined) {
          if (words < minWords) return { messageId: "reason", data: { min: String(minWords) } };
        } else if (words < minWords || words > maxWords) {
          return { messageId: "length", data: { min: String(minWords), max: String(maxWords) } };
        }
        if (cause === "required" && !outsideCause.test(reason)) return { messageId: "cause" };
        return null;
      }
      return {
        Program() {
          for (const group of commentGroups(context.sourceCode.getAllComments())) {
            const text = group.map(commentText).join(" ");
            if (isGovernedElsewhere(text)) continue;
            const loc = { start: group[0].loc.start, end: group.at(-1).loc.end };
            const problem = WHY_MARKER.test(text)
              ? reasonProblem(text.replace(WHY_MARKER, "").trim())
              : { messageId: "comment" };
            if (problem) context.report({ loc, ...problem });
          }
        },
      };
    },
  });
}
