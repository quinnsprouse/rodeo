# Agents share one set of hooks

Claude Code and Codex run the same scripts from `.agents/hooks/`, registered in `.claude/settings.json` and `.codex/hooks.json`. Separate copies drifted apart, and the guard missed Codex's `apply_patch` edits until both agents used one implementation.
