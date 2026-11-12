import { defineRule } from "vite-plus/lint/plugins";

export const DISABLE_DIRECTIVE = /^\s*((?:oxlint|eslint)-disable(?:-next-line|-line)?)/;

export const noDisableDirectives = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban inline oxlint-disable and eslint-disable comments; exceptions belong in lint/exceptions.ts.",
    },
    messages: {
      directive:
        "Line {{line}} has an inline lint suppression ({{directive}}). Fix the code, or add a file-scoped exception with a `why:` to lint/exceptions.ts.",
    },
    schema: [],
  },
  create(context) {
    // why: A directive suppresses diagnostics inside its own range, including the report about
    // itself. A zero-length span at 1:0 sits outside every range.
    const fileStart = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const match = DISABLE_DIRECTIVE.exec(comment.value);
          if (match) {
            context.report({
              loc: fileStart,
              messageId: "directive",
              data: { line: String(comment.loc.start.line), directive: match[1] },
            });
          }
        }
      },
    };
  },
});
