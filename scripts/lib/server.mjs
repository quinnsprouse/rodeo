import { spawn } from "node:child_process";
import { once } from "node:events";
import { closeSync, openSync } from "node:fs";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const host = "127.0.0.1";
const serverEntry = ".output/server/index.mjs";
const pollInterval = 200;
const startTimeout = 30_000;

function reservePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

function spawnServer({ root, logFile, port }) {
  const log = logFile === undefined ? undefined : openSync(logFile, "a");
  const server = spawn(process.execPath, [serverEntry], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", HOST: host, PORT: String(port) },
    stdio: log === undefined ? "ignore" : ["ignore", log, log],
  });
  if (log !== undefined) closeSync(log);
  return server;
}

async function answers(origin) {
  try {
    const response = await fetch(origin);
    await response.body?.cancel();
    return response.status < 500;
  } catch {
    return false;
  }
}

function hasExited(server) {
  return server.exitCode !== null || server.signalCode !== null;
}

async function waitForAnswer(server, origin, deadline) {
  if (await answers(origin)) return true;
  if (hasExited(server) || Date.now() >= deadline) return false;
  await delay(pollInterval);
  return waitForAnswer(server, origin, deadline);
}

function stopper(server) {
  return async () => {
    if (hasExited(server)) return;
    const exit = once(server, "exit");
    server.kill();
    await exit;
  };
}

export async function startBuiltServer({ root, logFile }) {
  const port = await reservePort();
  const origin = `http://${host}:${port}`;
  const server = spawnServer({ root, logFile, port });
  const stop = stopper(server);
  if (await waitForAnswer(server, origin, Date.now() + startTimeout)) return { origin, stop };
  const exitStatus = server.signalCode ?? server.exitCode;
  await stop();
  throw new Error(
    exitStatus === null
      ? `The built server in ${root} did not answer ${origin} with a status below 500 within ${startTimeout} ms.`
      : `The built server in ${root} exited with ${exitStatus} before it answered.`,
  );
}
