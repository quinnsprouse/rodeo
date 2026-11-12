import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const e2eEnvFile = new URL("../.env.e2e", import.meta.url);
const e2eEnv = parseEnv(readFileSync(e2eEnvFile, "utf8"));

function originOf(url: string | undefined) {
  if (!url) {
    throw new Error(`Set VITE_APP_URL in ${fileURLToPath(e2eEnvFile)}`);
  }
  return new URL(url).origin;
}

const defaultPort = 43_111;

function portFrom(value = String(defaultPort)) {
  const port = Number(value);
  if (!/^\d+$/.test(value) || port < 1 || port > 65_535) {
    throw new Error(`E2E_PORT must be a port number from 1 to 65535, but it is "${value}"`);
  }
  return port;
}

export const appOrigin = originOf(e2eEnv.VITE_APP_URL);
export const serverEnv = Object.fromEntries(
  Object.entries(e2eEnv).filter(([name]) => !name.startsWith("VITE_")),
);
export const host = "127.0.0.1";
export const port = portFrom(process.env.E2E_PORT);
export const baseURL = `http://${host}:${port}`;
