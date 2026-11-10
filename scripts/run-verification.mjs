import { spawn } from "node:child_process";

const TASK_COMMUNICATION_FAILURE = "Failed to set up task communication";
const OUTPUT_TAIL_LIMIT = 8_192;

const taskAndFlags = process.argv.slice(2);

if (!taskAndFlags.some((argument) => !argument.startsWith("-"))) {
  console.error("Usage: node scripts/run-verification.mjs [vp run flags] <verification-task>");
  process.exit(2);
}

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("vp", args, {
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let outputTail = "";

    function forward(stream, destination) {
      stream.on("data", (chunk) => {
        destination.write(chunk);
        outputTail = `${outputTail}${chunk}`.slice(-OUTPUT_TAIL_LIMIT);
      });
    }

    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code: code ?? 1, signal, outputTail }));
  });
}

let result = await run(["run", ...taskAndFlags]);

if (result.code !== 0 && result.outputTail.includes(TASK_COMMUNICATION_FAILURE)) {
  console.warn("Vite Task communication is unavailable; retrying this profile without cache.");
  result = await run(["run", "--no-cache", ...taskAndFlags]);
}

if (result.signal) {
  process.kill(process.pid, result.signal);
} else {
  process.exitCode = result.code;
}
