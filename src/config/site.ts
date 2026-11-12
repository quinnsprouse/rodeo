const tagline = "A free React starter for Claude Code and Codex.";
const repositorySlug = "quinnsprouse/rodeo";
const installCommand = `npx degit ${repositorySlug} my-app`;
const repository = `https://github.com/${repositorySlug}`;
const mainBranchFiles = `https://raw.githubusercontent.com/${repositorySlug}/main`;

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
        url: `${mainBranchFiles}/README.md`,
        description: "setup and scripts",
      },
      {
        title: "AGENTS.md",
        url: `${mainBranchFiles}/AGENTS.md`,
        description:
          "the rules agents follow in this codebase, with links to the guides in docs/agents",
      },
    ],
  },
};
