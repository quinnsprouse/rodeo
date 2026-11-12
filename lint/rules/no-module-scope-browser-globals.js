import { defineRule } from "vite-plus/lint/plugins";

import { enclosingFunction } from "./ast.js";

const BROWSER_GLOBALS = new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "location",
]);

export const noModuleScopeBrowserGlobals = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Browser globals touched at module scope crash on the server during SSR; read them inside a handler, an effect, or a typeof guard.",
    },
    messages: {
      ssr: "`{{name}}` is read at module scope, which throws during server rendering. Move the read into a function that runs in the browser, or guard it with typeof {{name}} !== 'undefined'.",
    },
    schema: [],
  },
  create(context) {
    return {
      Identifier(node) {
        if (!BROWSER_GLOBALS.has(node.name)) return;
        const { parent } = node;
        if (!parent) return;
        if (parent.type === "MemberExpression" && parent.property === node && !parent.computed)
          return;
        if (parent.type === "Property" && parent.key === node && !parent.computed) return;
        if (parent.type === "UnaryExpression" && parent.operator === "typeof") return;
        if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier") return;
        if (parent.type.startsWith("TS")) return;
        if (parent.type === "VariableDeclarator" && parent.id === node) return;
        if (enclosingFunction(node)) return;
        const scope = context.sourceCode.getScope(node);
        const declared = scope.references.some(
          (reference) => reference.identifier === node && reference.resolved !== null,
        );
        if (declared) return;
        context.report({ node, messageId: "ssr", data: { name: node.name } });
      },
    };
  },
});
