import { defineRule } from "vite-plus/lint/plugins";

import { calleeName } from "./ast.js";

export const spacingNamesShadowingContainers = ["xs", "xl"];

const classFunctions = new Set(["cn", "cva", "clsx", "cx", "twMerge", "twJoin", "tv"]);
const containerSize = new RegExp(
  String.raw`^(?:min-|max-)?inline-(${spacingNamesShadowingContainers.join("|")})$`,
);
const focusReplacement = /^(?:outline|ring|inset-ring)(?:-|$)/;

function removesOutline(utility) {
  return utility === "outline-none" || utility === "outline-hidden";
}

const checks = [
  {
    messageId: "border",
    matches: (utility) => /^border(?:-[xytrblse])?(?:-[1-9]\d*)?$/.test(utility),
  },
  { messageId: "transitionAll", matches: (utility) => utility === "transition-all" },
  { messageId: "outline", matches: removesOutline },
  { messageId: "logicalSize", matches: (utility) => containerSize.test(utility) },
];

function sizeReplacements(utility) {
  const [, side = "", name = ""] = /^(.*inline)-(\w+)$/.exec(utility) ?? [];
  return {
    width: `${side.replace("inline", "w")}-${name}`,
    spacing: `${side}-(--spacing-${name})`,
  };
}

function parseToken(token, node) {
  const parts = token.split(":");
  const utility = (parts.pop() ?? "").replaceAll("!", "");
  return { node, token, utility, variants: parts };
}

function isClassAttribute(node) {
  return (
    node.type === "JSXAttribute" &&
    node.name.type === "JSXIdentifier" &&
    (node.name.name === "className" || node.name.name === "class")
  );
}

function isClassCall(node) {
  return node.type === "CallExpression" && classFunctions.has(calleeName(node.callee));
}

function insideClassRoot(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (isClassAttribute(current) || isClassCall(current)) return true;
  }
  return false;
}

function isClassText(node) {
  const { parent } = node;
  if (parent?.type === "BinaryExpression") return false;
  return !(parent?.type === "Property" && parent.key === node);
}

function classStrings(node, found = []) {
  if (node.type === "Literal" && typeof node.value === "string" && isClassText(node)) {
    found.push({ node, text: node.value });
  }
  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) found.push({ node, text: quasi.value.cooked ?? "" });
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    for (const child of Array.isArray(value) ? value : [value]) {
      if (child && typeof child.type === "string") classStrings(child, found);
    }
  }
  return found;
}

function hasFocusReplacement(tokens) {
  return tokens.some(
    ({ utility, variants }) =>
      variants.some((variant) => variant.includes("focus-visible")) &&
      focusReplacement.test(utility) &&
      !removesOutline(utility),
  );
}

export const noOffThemeClasses = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Reject classes that bypass the theme: CSS borders, transition-all, a removed focus outline, and logical sizes whose names the spacing scale shadows.",
    },
    messages: {
      border:
        '"{{token}}" draws a CSS border. The theme draws every edge as a box shadow: use ring or inset-ring for an outline, and divider-t, divider-b, or divider-r for a divider. See docs/agents/UI_MOTION.md',
      transitionAll:
        '"{{token}}" animates every property, layout included. Name what moves, such as transition-colors or transition-[opacity,translate], with duration-(--motion-duration) ease-(--motion-easing). See docs/agents/UI_MOTION.md',
      outline:
        '"{{token}}" removes the theme\'s :focus-visible outline. Delete it, or replace the outline in the same class list with a focus-visible: style such as focus-visible:inset-ring-primary-transparent.',
      logicalSize:
        "\"{{token}}\" resolves to the spacing scale, because the theme's spacing names shadow Tailwind's container names. Write {{width}} for the container width, or {{spacing}} for the spacing value.",
    },
    schema: [],
  },
  create(context) {
    function checkRoot(root) {
      const strings = classStrings(root);
      const tokens = strings.flatMap(({ node, text }) =>
        text
          .split(/\s+/)
          .filter(Boolean)
          .map((token) => parseToken(token, node)),
      );
      const outlineReplaced = hasFocusReplacement(tokens);
      for (const { node, token, utility } of tokens) {
        const check = checks.find(({ matches }) => matches(utility));
        if (check === undefined) continue;
        if (check.messageId === "outline" && outlineReplaced) continue;
        context.report({
          node,
          messageId: check.messageId,
          data: { token, ...sizeReplacements(utility) },
        });
      }
    }
    return {
      JSXAttribute(node) {
        if (isClassAttribute(node) && !insideClassRoot(node)) checkRoot(node);
      },
      CallExpression(node) {
        if (isClassCall(node) && !insideClassRoot(node)) checkRoot(node);
      },
    };
  },
});
