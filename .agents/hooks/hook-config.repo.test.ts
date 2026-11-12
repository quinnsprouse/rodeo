import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";
import * as z from "zod/mini";

import { editTools } from "./edit-targets.mjs";
import { event as postEditEvent } from "./post-edit.mjs";
import { event as guardEvent, shellTool } from "./pre-tool-guard.mjs";
import { event as stopEvent } from "./stop-check.mjs";

const hooksDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(hooksDir, "..", "..");

const hookTable = z.object({
  hooks: z.record(
    z.string(),
    z.array(
      z.object({
        matcher: z.optional(z.string()),
        hooks: z.array(z.object({ command: z.string(), timeout: z.number() })),
      }),
    ),
  ),
});

const agents = {
  claude: hookTable.parse(
    JSON.parse(readFileSync(join(repoRoot, ".claude/settings.json"), "utf8")),
  ),
  codex: hookTable.parse(JSON.parse(readFileSync(join(repoRoot, ".codex/hooks.json"), "utf8"))),
};

const scriptPath = /(?<script>\.agents\/hooks\/[\w-]+\.mjs)"$/;

function registrations(table: z.infer<typeof hookTable>) {
  return Object.entries(table.hooks).flatMap(([event, groups]) =>
    groups.flatMap(({ matcher, hooks }) =>
      hooks.map(({ command, timeout }) => ({
        event,
        script: scriptPath.exec(command)?.groups?.["script"] ?? command,
        timeout,
        tools: matcher?.split("|").toSorted() ?? [],
      })),
    ),
  );
}

function scriptsByEvent(table: z.infer<typeof hookTable>) {
  return registrations(table).map(({ event, script, timeout }) => ({ event, script, timeout }));
}

function toolsFor(table: z.infer<typeof hookTable>, event: string) {
  return registrations(table)
    .filter((registration) => registration.event === event)
    .flatMap(({ tools }) => tools);
}

describe("agent hook configuration", () => {
  it("registers each hook script for the event its code handles", () => {
    expect(scriptsByEvent(agents.claude).map(({ event, script }) => ({ event, script }))).toEqual([
      { event: guardEvent, script: ".agents/hooks/pre-tool-guard.mjs" },
      { event: postEditEvent, script: ".agents/hooks/post-edit.mjs" },
      { event: stopEvent, script: ".agents/hooks/stop-check.mjs" },
    ]);
  });

  it("gives both agents the same scripts and timeouts", () => {
    expect(scriptsByEvent(agents.codex)).toEqual(scriptsByEvent(agents.claude));
  });

  it("points every command at a hook file that exists", () => {
    const scripts = [...registrations(agents.claude), ...registrations(agents.codex)].map(
      ({ script }) => script,
    );
    expect(scripts.filter((script) => !existsSync(join(repoRoot, script)))).toEqual([]);
  });

  it("guards every edit tool and the shell for each agent", () => {
    expect({
      claude: toolsFor(agents.claude, guardEvent),
      codex: toolsFor(agents.codex, guardEvent),
    }).toEqual({
      claude: [...editTools.claude, shellTool].toSorted(),
      codex: [...editTools.codex, shellTool].toSorted(),
    });
  });

  it("runs post-edit feedback only for tools whose edits it can read", () => {
    const unknownTools = {
      claude: toolsFor(agents.claude, postEditEvent).filter(
        (tool) => !editTools.claude.includes(tool),
      ),
      codex: toolsFor(agents.codex, postEditEvent).filter(
        (tool) => !editTools.codex.includes(tool),
      ),
    };
    expect(unknownTools).toEqual({ claude: [], codex: [] });
  });
});
