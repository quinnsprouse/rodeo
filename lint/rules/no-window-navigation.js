import { defineRule } from "vite-plus/lint/plugins";

function isLocation(node) {
  if (node.type === "Identifier") return node.name === "location";
  return (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object.type === "Identifier" &&
    (node.object.name === "window" || node.object.name === "globalThis") &&
    node.property.type === "Identifier" &&
    node.property.name === "location"
  );
}

export const noWindowNavigation = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Navigate with the router, not window.location; hard navigations drop router state, loaders, and preloading.",
    },
    messages: {
      navigate:
        "Use the router instead of window.location: useNavigate() or <Link> from @tanstack/react-router keeps loaders, search params, and preloading working. See docs/agents/TANSTACK_START.md",
    },
    schema: [],
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        const target = node.left;
        if (target.type !== "MemberExpression") return;
        if (isLocation(target)) {
          context.report({ node, messageId: "navigate" });
          return;
        }
        if (
          !target.computed &&
          target.property.type === "Identifier" &&
          (target.property.name === "href" || target.property.name === "pathname") &&
          isLocation(target.object)
        ) {
          context.report({ node, messageId: "navigate" });
        }
      },
      CallExpression(node) {
        const { callee } = node;
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          (callee.property.name === "assign" || callee.property.name === "replace") &&
          isLocation(callee.object)
        ) {
          context.report({ node, messageId: "navigate" });
        }
      },
    };
  },
});
