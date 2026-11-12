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

function isBuiltInKey(property) {
  return (
    property.type === "Property" &&
    !property.computed &&
    property.key.type === "Identifier" &&
    VITE_BUILT_IN_ENV.has(property.key.name)
  );
}

function takesOnlyBuiltIns(pattern) {
  return (
    pattern?.type === "ObjectPattern" &&
    pattern.properties.length > 0 &&
    pattern.properties.every(isBuiltInKey)
  );
}

function destructuredEnv(pattern) {
  if (pattern.type !== "ObjectPattern") return null;
  const envProperty = pattern.properties.find(
    (property) =>
      property.type === "Property" &&
      (property.key.type === "Identifier"
        ? property.key.name === "env"
        : property.key.type === "Literal" && property.key.value === "env"),
  );
  return envProperty ?? null;
}

function readsBuiltInEnv(envMember) {
  const { parent } = envMember;
  if (parent?.type === "VariableDeclarator" && parent.init === envMember) {
    return takesOnlyBuiltIns(parent.id);
  }
  return (
    parent?.type === "MemberExpression" &&
    parent.object === envMember &&
    !parent.computed &&
    parent.property.type === "Identifier" &&
    VITE_BUILT_IN_ENV.has(parent.property.name)
  );
}

function envMembersThroughAlias(context, declarator) {
  return context.sourceCode
    .getDeclaredVariables(declarator)
    .flatMap((variable) => variable.references)
    .map((reference) => reference.identifier)
    .filter(
      (identifier) =>
        identifier.parent?.type === "MemberExpression" &&
        identifier.parent.object === identifier &&
        isPropertyNamed(identifier.parent, "env"),
    )
    .map(({ parent }) => parent);
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
    function checkEnvMember(member) {
      if (!readsBuiltInEnv(member)) context.report({ node: member, messageId: "env", data });
    }
    return {
      MetaProperty(node) {
        if (!isImportMeta(node)) return;
        const { parent } = node;
        if (parent?.type === "MemberExpression" && parent.object === node) {
          if (isPropertyNamed(parent, "env")) checkEnvMember(parent);
          return;
        }
        if (parent?.type !== "VariableDeclarator" || parent.init !== node) return;
        if (parent.id.type === "Identifier") {
          for (const member of envMembersThroughAlias(context, parent)) checkEnvMember(member);
          return;
        }
        const envProperty = destructuredEnv(parent.id);
        if (envProperty && !takesOnlyBuiltIns(envProperty.value)) {
          context.report({ node: parent, messageId: "env", data });
        }
      },
    };
  },
});
