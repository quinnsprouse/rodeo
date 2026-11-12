import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { sections } from "@/demo/philosophy/sections";
import { useActiveSection } from "@/demo/philosophy/use-active-section";
import { useFollowActiveRow } from "@/demo/use-follow-active-row";
import { cn } from "@/lib/utils";

const sectionIds = sections.map((section) => section.id);

export function Contents() {
  const active = useActiveSection(sectionIds);
  const contents = useRef<HTMLOListElement>(null);
  const marker = useFollowActiveRow(contents, active, "data-section");

  return (
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
            {sections.map((section) => (
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
  );
}
