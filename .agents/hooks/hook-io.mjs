import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const outputLimit = 4_000;
const ellipsis = "...";

export function truncate(text, { keep, limit = outputLimit }) {
  if (text.length <= limit) return text;
  const kept = limit - ellipsis.length;
  return keep === "start" ? `${text.slice(0, kept)}${ellipsis}` : `${ellipsis}${text.slice(-kept)}`;
}

function projectRoot() {
  return realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."));
}

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    // why: A hook that cannot parse its input must not block the agent.
    return null;
  }
}

async function handlerOutput(handler, input, name) {
  try {
    return await handler(input, { root: projectRoot() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { systemMessage: `The ${name} could not run: ${message}` };
  }
}

export async function runHook(handler, { event, name }) {
  const input = readInput();
  if (input?.hook_event_name !== event) return;
  const output = await handlerOutput(handler, input, name);
  if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
}
