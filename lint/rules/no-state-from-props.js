import { defineRule } from "vite-plus/lint/plugins";

import { calleeName, enclosingFunction, isFunction } from "./ast.js";

const INITIAL_PROP_PREFIXES = ["default", "initial"];
const INITIAL_PROP = new RegExp(String.raw`^(?:${INITIAL_PROP_PREFIXES.join("|")})[A-Z_]`);

function withoutDefault(node) {
  return node?.type === "AssignmentPattern" ? node.left : node;
}

function staticKey(property) {
  if (property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  return property.key.type === "Literal" ? String(property.key.value) : null;
}

function collectDestructuredProps(pattern, propByLocal) {
  if (pattern?.type !== "ObjectPattern") return;
  for (const property of pattern.properties) {
    const local = property.type === "Property" ? withoutDefault(property.value) : null;
    if (local?.type === "Identifier")
      propByLocal.set(local.name, staticKey(property) ?? local.name);
  }
}

function propsOf(component) {
  const param = withoutDefault(component.params[0]);
  const propByLocal = new Map();
  collectDestructuredProps(param, propByLocal);
  if (param?.type !== "Identifier" || component.body.type !== "BlockStatement") {
    return { param, propByLocal };
  }
  for (const statement of component.body.body) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const { id, init } of statement.declarations) {
      if (init?.type === "Identifier" && init.name === param.name) {
        collectDestructuredProps(id, propByLocal);
      }
    }
  }
  return { param, propByLocal };
}

function lazyResult(initializer) {
  if (initializer.body.type !== "BlockStatement") return initializer.body;
  const [statement] = initializer.body.body;
  const returnsOnly = initializer.body.body.length === 1 && statement.type === "ReturnStatement";
  return returnsOnly ? statement.argument : null;
}

function seedOf(initial) {
  const seed = isFunction(initial) && initial.params.length === 0 ? lazyResult(initial) : initial;
  const fallsBack =
    seed?.type === "LogicalExpression" && (seed.operator === "??" || seed.operator === "||");
  return fallsBack ? seed.left : seed;
}

function seedingProp(seed, { param, propByLocal }) {
  if (seed?.type === "Identifier") return propByLocal.get(seed.name) ?? null;
  const readsPropsObject =
    seed?.type === "MemberExpression" &&
    !seed.computed &&
    seed.object.type === "Identifier" &&
    param?.type === "Identifier" &&
    seed.object.name === param.name &&
    seed.property.type === "Identifier";
  return readsPropsObject ? seed.property.name : null;
}

export const noStateFromProps = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "useState seeded from a prop silently desyncs when the prop changes; derive the value, lift the state, or remount with key.",
    },
    messages: {
      prop: "useState is seeded from prop `{{name}}`, which will not update when the prop changes. Derive it during render, lift the state to the parent, or pass key= to remount. Props named {{exempt}} are exempt. See docs/agents/REACT_PATTERNS.md",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (calleeName(node.callee) !== "useState") return;
        const [initial] = node.arguments;
        const component = enclosingFunction(node);
        if (!initial || !component) return;
        const propName = seedingProp(seedOf(initial), propsOf(component));
        if (propName && !INITIAL_PROP.test(propName)) {
          const exempt = INITIAL_PROP_PREFIXES.map((prefix) => `${prefix}*`).join("/");
          context.report({ node: initial, messageId: "prop", data: { name: propName, exempt } });
        }
      },
    };
  },
});
