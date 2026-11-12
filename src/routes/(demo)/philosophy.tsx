import { createFileRoute } from "@tanstack/react-router";

import { PhilosophyArticle } from "@/demo/philosophy/article";
import { Contents } from "@/demo/philosophy/contents";
import { philosophyPage } from "@/demo/philosophy/page";

export const Route = createFileRoute("/(demo)/philosophy")({
  staticData: { canvas: "card", page: philosophyPage },
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
