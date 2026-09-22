import { z } from "zod";

function blankToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

// Every VITE_* variable the app reads. Vite inlines these into the client bundle, so never put a
// secret here. Add each new variable to this schema, to src/vite-env.d.ts, and to .env.example.
const clientEnvSchema = z.object({
  // Public production origin for canonical and social metadata. Optional in local development.
  VITE_APP_URL: z.preprocess(
    blankToUndefined,
    z
      .url({ protocol: /^https?$/ })
      .transform((url) => new URL(url).origin)
      .optional(),
  ),
});

export function parseClientEnv(env: Record<string, unknown>) {
  const result = clientEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

// Parsed once at startup, so a bad value fails with its name instead of breaking a page later.
export const clientEnv = parseClientEnv(import.meta.env);
