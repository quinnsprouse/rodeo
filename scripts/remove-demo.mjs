import { preflightProblems, removeDemo } from "#tooling/demo-removal";

function fail(heading, lines) {
  console.error(`${heading}\n`);
  for (const line of lines) console.error(`${line}\n`);
  process.exitCode = 1;
}

function main() {
  const problems = preflightProblems();
  if (problems.length > 0) {
    fail("Nothing was changed. The demo is not in the state this script expects:", problems);
    return;
  }
  const stepsLeft = removeDemo();
  if (stepsLeft.length > 0) {
    fail("The demo is removed, but the route tree was not regenerated. To finish:", stepsLeft);
    return;
  }
  console.log("Removed the demo. Run npm run check:push to verify the starter.");
}

if (import.meta.main) main();
