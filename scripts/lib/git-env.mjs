import { devNull } from "node:os";

export const hermeticGitSettings = { GIT_CONFIG_GLOBAL: devNull, GIT_CONFIG_NOSYSTEM: "1" };

export function hermeticGitEnv() {
  return {
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_"))),
    ...hermeticGitSettings,
  };
}
