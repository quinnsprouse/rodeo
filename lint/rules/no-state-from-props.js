import { defineRule } from "vite-plus/lint/plugins";

import { calleeName, enclosingFunction } from "./ast.js";

const INITIAL_PROP_PREFIXES = ["default", "initial"];
const INITIAL_PROP = new RegExp(String.raw`^(?:${INITIAL_PROP_PREFIXES.join("|")})[A-Z_]`);

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
        if (!initial) return;
        const component = enclosingFunction(node);
        if (!component) return;
        const [param] = component.params;
        if (!param) return;
        let propName = null;
        if (
          initial.type === "Identifier" &&
          param.type === "ObjectPattern" &&
          param.properties.some(
            (property) =>
              property.type === "Property" &&
              property.value.type === "Identifier" &&
              property.value.name === initial.name,
          )
        ) {
          propName = initial.name;
        } else if (
          initial.type === "MemberExpression" &&
          !initial.computed &&
          initial.object.type === "Identifier" &&
          param.type === "Identifier" &&
          initial.object.name === param.name &&
          initial.property.type === "Identifier"
        ) {
          propName = initial.property.name;
        }
        if (propName && !INITIAL_PROP.test(propName)) {
          const exempt = INITIAL_PROP_PREFIXES.map((prefix) => `${prefix}*`).join("/");
          context.report({ node: initial, messageId: "prop", data: { name: propName, exempt } });
        }
      },
    };
  },
});
