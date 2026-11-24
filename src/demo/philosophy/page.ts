import type { Page } from "@/config/pages";

export const published = "2026-10-17";

export const philosophyPage = {
  title: "Rodeo Philosophy",
  description:
    "how i think about building with agents, and why rodeo has strict lint and no code comments, unit tests, or long docs.",
  image: {
    path: "/og-rationale.png",
    version: "e2240c55b59e",
    alt: "Rodeo Philosophy: why rodeo has no code comments, unit tests, or long docs. With coin, scissors, and codebase stickers.",
  },
  structuredData: ({ url, title, description, imageUrl, author }) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    image: imageUrl,
    datePublished: published,
    author,
  }),
} satisfies Page;
