import { createFileRoute, Link } from "@tanstack/react-router";

import { RationaleArticle, rationaleSections } from "@/components/rationale-article";
import { ThemeToggle } from "@/components/theme-toggle";
import { pageMeta, philosophyMeta } from "@/config/site";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

const sectionIds = rationaleSections.map((section) => section.id);

export const Route = createFileRoute("/rationale")({
  staticData: { canvas: "card" },
  head: () => ({ meta: pageMeta(philosophyMeta) }),
  component: Rationale,
});

function Rationale() {
  const active = useActiveSection(sectionIds);

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
          <ol className="mt-xxl hidden space-y-s text-s xl:block">
            {rationaleSections.map((section) => (
              <li key={section.id}>
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
        </nav>
      </aside>

      <main id="main" className="mx-auto mt-xl w-full max-w-[560px] xl:mt-0">
        <RationaleArticle />
      </main>
    </div>
  );
}
