import type { Page } from "@/config/pages";

export const published = "2026-10-17";

export const philosophyPage: Page = {
  title: "Rodeo Philosophy",
  description:
    "how i think about building with agents, and why rodeo drops code comments, unit tests, and long docs.",
  image: {
    path: "/og-rationale.png",
    alt: "Rodeo Philosophy: how i think about building with agents. With coin, scissors, and codebase stickers.",
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
};
