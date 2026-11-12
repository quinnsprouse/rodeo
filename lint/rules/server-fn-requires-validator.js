import { defineRule } from "vite-plus/lint/plugins";

import { calleeName, isFunction } from "./ast.js";

function chainMethods(call) {
  const methods = [];
  let current = call;
  while (current.type === "CallExpression") {
    const { callee } = current;
    if (
      callee.type === "MemberExpression" &&
      !callee.computed &&
      callee.property.type === "Identifier"
    ) {
      methods.push(callee.property.name);
      current = callee.object;
    } else if (callee.type === "Identifier") {
      return { root: callee.name, methods };
    } else {
      return { root: null, methods };
    }
  }
  return { root: null, methods };
}

function subtreeSome(node, predicate) {
  if (!node || typeof node.type !== "string") return false;
  if (predicate(node)) return true;
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      if (
        value.some(
          (child) => child && typeof child.type === "string" && subtreeSome(child, predicate),
        )
      )
        return true;
    } else if (value && typeof value.type === "string" && subtreeSome(value, predicate)) {
      return true;
    }
  }
  return false;
}

export const serverFnRequiresValidator = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "A createServerFn handler that reads `data` must declare a validator so untrusted input is checked at the boundary.",
    },
    messages: {
      missing:
        "This server function reads `data` without a validator. Add .validator(schema) with a Zod schema before .handler(); see docs/agents/TANSTACK_START.md",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (calleeName(node.callee) !== "handler") return;
        const { root, methods } = chainMethods(node);
        if (root !== "createServerFn") return;
        // why: inputValidator is the deprecated name, and no-deprecated already reports it.
        if (methods.includes("validator") || methods.includes("inputValidator")) return;
        const handler = node.arguments[0];
        if (!handler || !isFunction(handler)) return;
        const [param] = handler.params;
        if (!param) return;
        const readsData =
          (param.type === "ObjectPattern" &&
            param.properties.some(
              (property) =>
                property.type === "Property" &&
                property.key.type === "Identifier" &&
                property.key.name === "data",
            )) ||
          (param.type === "Identifier" &&
            subtreeSome(
              handler.body,
              (candidate) =>
                candidate.type === "MemberExpression" &&
                candidate.object.type === "Identifier" &&
                candidate.object.name === param.name &&
                !candidate.computed &&
                candidate.property.type === "Identifier" &&
                candidate.property.name === "data",
            ));
        if (readsData) context.report({ node: node.callee, messageId: "missing" });
      },
    };
  },
});
