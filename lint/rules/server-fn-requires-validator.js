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

function isNamed(key, computed, name) {
  if (computed) return key.type === "Literal" && key.value === name;
  return key.type === "Identifier" && key.name === name;
}

function patternTakesData(pattern) {
  return (
    pattern?.type === "ObjectPattern" &&
    pattern.properties.some(
      (property) =>
        property.type === "Property" && isNamed(property.key, property.computed, "data"),
    )
  );
}

function isIdentifierNamed(node, name) {
  return node?.type === "Identifier" && node.name === name;
}

function takesDataFrom(name) {
  return (node) =>
    (node.type === "MemberExpression" &&
      isIdentifierNamed(node.object, name) &&
      isNamed(node.property, node.computed, "data")) ||
    (node.type === "VariableDeclarator" &&
      isIdentifierNamed(node.init, name) &&
      patternTakesData(node.id));
}

function readsData(handler) {
  const [first] = handler.params;
  const param = first?.type === "AssignmentPattern" ? first.left : first;
  if (patternTakesData(param)) return true;
  return param?.type === "Identifier" && subtreeSome(handler.body, takesDataFrom(param.name));
}

function handlerFunction(context, argument) {
  if (!argument || isFunction(argument)) return argument ?? null;
  if (argument.type !== "Identifier") return null;
  const reference = context.sourceCode
    .getScope(argument)
    .references.find((candidate) => candidate.identifier === argument);
  const definition = reference?.resolved?.defs[0]?.node;
  if (definition?.type === "FunctionDeclaration") return definition;
  const init = definition?.type === "VariableDeclarator" ? definition.init : null;
  return init && isFunction(init) ? init : null;
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
        const handler = handlerFunction(context, node.arguments[0]);
        if (handler && readsData(handler))
          context.report({ node: node.callee, messageId: "missing" });
      },
    };
  },
});
