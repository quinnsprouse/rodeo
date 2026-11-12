import { defineRule } from "vite-plus/lint/plugins";

import { isFunction } from "./ast.js";

const BROWSER_GLOBALS = new Set([
  "window",
  "self",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "location",
  "history",
  "matchMedia",
]);

function isImmediatelyInvoked(fn) {
  return fn.parent?.type === "CallExpression" && fn.parent.callee === fn;
}

function runsLater(node, child) {
  if (isFunction(node)) return !isImmediatelyInvoked(node);
  return node.type === "PropertyDefinition" && !node.static && node.value === child;
}

const TYPEOF_GUARD = new RegExp(
  String.raw`\btypeof\s+(?:globalThis\.)?(?:${[...BROWSER_GLOBALS].join("|")})\b`,
);
const GUARD_TEST_KEY = {
  ConditionalExpression: "test",
  IfStatement: "test",
  LogicalExpression: "left",
};

function isGuardedBranch(context, node, child) {
  const testKey = GUARD_TEST_KEY[node.type];
  if (testKey === undefined || node[testKey] === child) return false;
  return TYPEOF_GUARD.test(context.sourceCode.getText(node[testKey]));
}

function runsUnguardedOnImport(context, node) {
  for (
    let child = node, current = node.parent;
    current;
    child = current, current = current.parent
  ) {
    if (runsLater(current, child) || isGuardedBranch(context, current, child)) return false;
  }
  return true;
}

function readsUndeclaredGlobal(context, identifier) {
  if (identifier.parent?.type.startsWith("TS")) return false;
  const reference = context.sourceCode
    .getScope(identifier)
    .references.find((candidate) => candidate.identifier === identifier);
  if (reference === undefined) return false;
  const definitions = reference.resolved?.defs.length ?? 0;
  return definitions === 0;
}

function browserGlobalRead(context, identifier) {
  const { parent } = identifier;
  if (parent?.type === "MemberExpression" && parent.property === identifier && !parent.computed) {
    const { object } = parent;
    const viaGlobalThis =
      object.type === "Identifier" &&
      object.name === "globalThis" &&
      readsUndeclaredGlobal(context, object);
    return viaGlobalThis ? parent : null;
  }
  return readsUndeclaredGlobal(context, identifier) ? identifier : null;
}

function isTypeofOperand(node) {
  return node.parent?.type === "UnaryExpression" && node.parent.operator === "typeof";
}

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
        const read = browserGlobalRead(context, node);
        if (read === null || isTypeofOperand(read) || !runsUnguardedOnImport(context, read)) {
          return;
        }
        const name = context.sourceCode.getText(read);
        context.report({ node: read, messageId: "ssr", data: { name } });
      },
    };
  },
});
