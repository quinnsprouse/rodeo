import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const e2eEnvFile = new URL("../.env.e2e", import.meta.url);
const { VITE_APP_URL } = parseEnv(readFileSync(e2eEnvFile, "utf8"));

function originOf(url: string | undefined) {
  if (!url) {
    throw new Error(`Set VITE_APP_URL in ${fileURLToPath(e2eEnvFile)}`);
  }
  return new URL(url).origin;
}

export const appOrigin = originOf(VITE_APP_URL);
export const host = "127.0.0.1";
export const port = 43_111;
export const baseURL = `http://${host}:${port}`;
