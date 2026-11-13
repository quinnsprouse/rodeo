import type { ReactNode } from "react";

import { concealed, reveal } from "@/demo/motion-classes";
import { Figure, timeline, useFigure } from "@/demo/philosophy/figures/figure";
import { Highlight } from "@/demo/philosophy/figures/highlight";
import { useHoveredData } from "@/demo/use-hovered-data";
import { cn } from "@/lib/utils";

type Idea = "author" | "admin";

const beats = timeline({ withoutRodeo: 150, rodeo: 500, author: 650, admin: 450 });

function Mark({ idea, lit, children }: { idea: Idea; lit: boolean; children: ReactNode }) {
  return (
    <Highlight data-idea={idea} lit={lit} className="cursor-default">
      {children}
    </Highlight>
  );
}

function Row({ label, shown, children }: { label: string; shown: boolean; children: ReactNode }) {
  return (
    <>
      <span
        className={cn(
          "mt-s text-s text-foreground first:mt-0 sm:mt-0",
          reveal,
          !shown && concealed,
        )}
      >
        {label}
      </span>
      <pre
        className={cn(
          "rounded-m bg-muted px-m py-s font-data text-xs leading-4.5 whitespace-pre-wrap text-foreground delay-100",
          reveal,
          !shown && concealed,
        )}
      >
        <code>{children}</code>
      </pre>
    </>
  );
}

export function RenameFigure() {
  const figure = useFigure(beats);
  const { beat } = figure;
  const { hovered, handlers } = useHoveredData("idea");
  const named = (idea: Idea) => (hovered === null ? beat >= beats.at(idea) : hovered === idea);
  const spelledOut = (idea: Idea) => hovered === idea;

  return (
    <Figure
      figure={figure}
      caption="a better name does the comment's job, and that's what the next agent copies."
    >
      <div
        {...handlers}
        className="grid items-center gap-x-m gap-y-xs sm:grid-cols-[112px_1fr] sm:gap-y-m"
      >
        <Row label="without rodeo" shown={beat >= beats.at("withoutRodeo")}>
          <span className="text-muted-foreground">
            {"// only "}
            <Mark idea="author" lit={named("author")}>
              authors
            </Mark>
            {" and "}
            <Mark idea="admin" lit={named("admin")}>
              admins
            </Mark>
            {" can edit"}
          </span>
          {"\nif ("}
          <Mark idea="author" lit={spelledOut("author")}>
            user.id === post.authorId
          </Mark>
          {" ||\n    "}
          <Mark idea="admin" lit={spelledOut("admin")}>
            user.role === "admin"
          </Mark>
          {") {"}
        </Row>
        <Row label="rodeo" shown={beat >= beats.at("rodeo")}>
          {"if ("}
          <Mark idea="author" lit={named("author")}>
            isAuthor
          </Mark>
          {"(user, post) ||\n    "}
          <Mark idea="admin" lit={named("admin")}>
            isAdmin
          </Mark>
          {"(user)) {"}
        </Row>
      </div>
    </Figure>
  );
}
