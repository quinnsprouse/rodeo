import { createFileRoute } from "@tanstack/react-router";

import { clientEnv } from "@/config/env";
import { pageMeta, philosophyMeta } from "@/config/site";
import { PhilosophyArticle } from "@/demo/philosophy/article";
import { Contents } from "@/demo/philosophy/contents";
import { philosophyStructuredData, structuredDataScript } from "@/lib/structured-data";

export const Route = createFileRoute("/(demo)/philosophy")({
  staticData: { canvas: "card" },
  head: () => ({
    meta: pageMeta(philosophyMeta),
    scripts: clientEnv.VITE_APP_URL
      ? [structuredDataScript(philosophyStructuredData(clientEnv.VITE_APP_URL))]
      : [],
  }),
  component: Philosophy,
});

function Philosophy() {
  return (
    <div className="min-h-svh bg-card px-l py-xxl sm:px-xl xl:grid xl:grid-cols-[1fr_560px_1fr] xl:gap-xxl xl:px-0 xl:py-22">
      <Contents />

      <main id="main" className="mx-auto mt-xl w-full max-w-[560px] xl:mt-0">
        <PhilosophyArticle />
      </main>
    </div>
  );
}
