import { devNull } from "node:os";

export const hermeticGitSettings = { GIT_CONFIG_GLOBAL: devNull, GIT_CONFIG_NOSYSTEM: "1" };

export function hermeticGitEnv(env = process.env) {
  return {
    ...Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith("GIT_"))),
    ...hermeticGitSettings,
  };
}
