const tagline = "A free React starter for Claude Code and Codex.";
const installCommand = "npx degit quinnsprouse/rodeo my-app";
const repository = "https://github.com/quinnsprouse/rodeo";

export const site = {
  name: "Rodeo",
  tagline,
  title: "Rodeo — React starter for Claude Code and Codex",
  description:
    "Lint, hooks, and browser tests catch an agent's mistakes before you review them. Free, and built on Vite+ and TanStack Start.",
  image: {
    path: "/og-home.png",
    alt: "The Rodeo logo: a purple bull sticker beside the word rodeo.",
  },
  repository,
  installCommand,
  author: {
    name: "Quinn Sprouse",
    url: "https://github.com/quinnsprouse",
    xHandle: "QuinnSprouse",
  },
  llms: {
    details: `${tagline} Start a project with \`${installCommand}\`, then point your agent at AGENTS.md. Each page below is also available as Markdown.`,
    sourceLinks: [
      { title: "Repository", url: repository, description: "the code behind this site" },
      {
        title: "README",
        url: "https://raw.githubusercontent.com/quinnsprouse/rodeo/main/README.md",
        description: "setup and scripts",
      },
      {
        title: "AGENTS.md",
        url: "https://raw.githubusercontent.com/quinnsprouse/rodeo/main/AGENTS.md",
        description:
          "the rules agents follow in this codebase, with links to the guides in docs/agents",
      },
    ],
  },
};
