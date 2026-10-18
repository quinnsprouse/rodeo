import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { RationaleArticle, rationaleSections } from "@/components/rationale-article";
import { ThemeToggle } from "@/components/theme-toggle";
import { clientEnv } from "@/config/env";
import { pageMeta, philosophyMeta } from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { philosophyStructuredData, structuredDataScript } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

const sectionIds = rationaleSections.map((section) => section.id);

export const Route = createFileRoute("/philosophy")({
  staticData: { canvas: "card" },
  head: () => ({
    meta: pageMeta(philosophyMeta),
    scripts: clientEnv.VITE_APP_URL
      ? [structuredDataScript(philosophyStructuredData(clientEnv.VITE_APP_URL))]
      : [],
  }),
  component: Rationale,
});

function Rationale() {
  const active = useActiveSection(sectionIds);
  const contents = useRef<HTMLOListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const item = contents.current?.querySelector<HTMLElement>(`[data-section="${active}"]`);
    const line = marker.current;
    if (!item || !line) return;
    line.style.setProperty("--row-top", `${item.offsetTop}px`);
    line.style.setProperty("--row-height", `${item.offsetHeight}px`);
  }, [active]);

  return (
    <div className="min-h-svh bg-card px-l py-xxl sm:px-xl xl:grid xl:grid-cols-[1fr_560px_1fr] xl:gap-xxl xl:px-0 xl:py-22">
      <aside className="xl:sticky xl:top-[88px] xl:self-start xl:justify-self-end">
        <nav aria-label="Contents" className="xl:w-[200px]">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-s text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground"
            >
              ↩ Home
            </Link>
            <ThemeToggle className="-my-2.5 -mr-2.5" />
          </div>
          <div className="relative mt-xxl hidden text-s xl:block">
            <ol ref={contents} className="space-y-s">
              {rationaleSections.map((section) => (
                <li key={section.id} data-section={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={active === section.id ? "location" : undefined}
                    className={cn(
                      "transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground",
                      active === section.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <span
              ref={marker}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-0 -left-s follow-active-row w-0.5 rounded-full bg-foreground",
                !active && "opacity-0",
              )}
            />
          </div>
        </nav>
      </aside>

      <main id="main" className="mx-auto mt-xl w-full max-w-[560px] xl:mt-0">
        <RationaleArticle />
      </main>
    </div>
  );
}
