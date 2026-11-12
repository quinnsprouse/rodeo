import { defineRule } from "vite-plus/lint/plugins";

const VITE_BUILT_IN_ENV = new Set(["DEV", "PROD", "SSR", "MODE", "BASE_URL"]);

function isImportMeta(node) {
  return (
    node.type === "MetaProperty" && node.meta.name === "import" && node.property.name === "meta"
  );
}

function isPropertyNamed(member, name) {
  if (member.computed) return member.property.type === "Literal" && member.property.value === name;
  return member.property.type === "Identifier" && member.property.name === name;
}

function destructuresEnv(pattern) {
  return (
    pattern.type === "ObjectPattern" &&
    pattern.properties.some(
      (property) =>
        property.type === "Property" &&
        (property.key.type === "Identifier"
          ? property.key.name === "env"
          : property.key.type === "Literal" && property.key.value === "env"),
    )
  );
}

function readsBuiltInEnv(envMember) {
  const { parent } = envMember;
  return (
    parent?.type === "MemberExpression" &&
    parent.object === envMember &&
    !parent.computed &&
    parent.property.type === "Identifier" &&
    VITE_BUILT_IN_ENV.has(parent.property.name)
  );
}

export const noImportMetaEnv = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Read VITE_* variables through clientEnv, which validates them at startup, not from import.meta.env.",
    },
    messages: {
      env: "Read environment variables from clientEnv in @/config/env, which validates them when the app starts. Vite's built-in flags ({{builtIns}}) may be read directly. To add a variable, add it to the schema in src/config/env.ts and to .env.example.",
    },
    schema: [],
  },
  create(context) {
    const data = { builtIns: [...VITE_BUILT_IN_ENV].join(", ") };
    return {
      MetaProperty(node) {
        if (!isImportMeta(node)) return;
        const { parent } = node;
        if (parent?.type === "MemberExpression" && parent.object === node) {
          if (isPropertyNamed(parent, "env") && !readsBuiltInEnv(parent)) {
            context.report({ node: parent, messageId: "env", data });
          }
          return;
        }
        if (parent?.type === "VariableDeclarator" && destructuresEnv(parent.id)) {
          context.report({ node: parent, messageId: "env", data });
        }
      },
    };
  },
});
