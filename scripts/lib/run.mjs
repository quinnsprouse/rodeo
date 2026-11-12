import { spawn } from "node:child_process";
import { once } from "node:events";

export async function run(command, args, { cwd, env, input } = {}) {
  const child = spawn(command, args, { cwd, env });
  const collected = { stdout: "", stderr: "", output: "" };
  const collect = (stream) => (chunk) => {
    collected[stream] += chunk;
    collected.output += chunk;
  };
  child.stdout.setEncoding("utf8").on("data", collect("stdout"));
  child.stderr.setEncoding("utf8").on("data", collect("stderr"));
  if (input !== undefined) child.stdin.end(input);
  const [code] = await once(child, "close");
  return { status: typeof code === "number" ? code : null, ...collected };
}
