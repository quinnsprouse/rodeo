import { type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "unexplained empty catch blocks",
    rule: "no-empty",
    source: `export async function save(action: () => Promise<void>) {
try { await action(); } catch {}
}`,
  },
  {
    name: "a function that falls through without returning",
    rule: "typescript(TS7030)",
    source: `export function label(enabled: boolean) {
if (enabled) return "Ready";
}`,
  },
  {
    name: "a union member hidden by a default case",
    rule: "typescript(switch-exhaustiveness-check)",
    source: `export function label(status: "ready" | "failed") {
switch (status) {
  case "ready": return "Ready";
  default: return "Unknown";
}
}`,
  },
  {
    name: "coercive equality comparisons",
    rule: "eqeqeq",
    source: `export function isEqual(left: string | number, right: string | number) {
return left == right;
}`,
  },
  {
    name: "promise rejections without an Error",
    rule: "typescript(prefer-promise-reject-errors)",
    source: `export function save() { return Promise.reject("Failed to save"); }`,
  },
  {
    name: "Promise methods called with extra arguments",
    rule: "typescript(TS2554)",
    source: `export const settled = Promise.resolve(1).catch(() => 0, () => 1);`,
  },
  {
    name: "throwing a value that is not an Error",
    rule: "typescript(only-throw-error)",
    source: `export function fail() { throw "Failed to save"; }`,
  },
  {
    name: "catch callbacks that type the error as any",
    rule: "typescript(use-unknown-in-catch-callback-variable)",
    source: `export const failure = Promise.reject(new Error("Failed")).catch((error) => error);`,
  },
  {
    name: "async functions that never await",
    rule: "typescript(require-await)",
    source: `export async function load() { return 1; }`,
  },
  {
    name: "a promise returned from try without await",
    rule: "typescript(return-await)",
    source: `export async function load(fetchItem: () => Promise<number>) {
try { return fetchItem(); } catch { return 0; }
}`,
  },
  {
    name: "browser dialogs",
    rule: "eslint(no-alert)",
    source: `export function notify() { alert("Saved"); }`,
  },
];

export const correctnessProbes: PolicyTopic = { rejected };
