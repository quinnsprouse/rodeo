import { useRef, useState, type ReactNode } from "react";

import { Card, Figure } from "@/components/figures/figure";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { hoveredData } from "@/lib/hover";
import { concealed, reveal } from "@/lib/motion-classes";
import { cn } from "@/lib/utils";

type Idea = "author" | "admin";

const beats = [500, 650, 450, 300];
const rodeoBeat = 1;
const namedBeat: Record<Idea, number> = { author: 2, admin: 3 };

function Mark({ idea, lit, children }: { idea: Idea; lit: boolean; children: ReactNode }) {
  return (
    <span
      data-idea={idea}
      className={cn(
        "relative isolate cursor-default transition-colors duration-300 ease-(--motion-large-easing)",
        lit && "text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-x-0.5 inset-y-0 -z-10 origin-left rounded-xs bg-primary-transparent transition-transform duration-300 ease-(--motion-large-easing)",
          !lit && "scale-x-0",
        )}
      />
      {children}
    </span>
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
  const card = useRef<HTMLDivElement>(null);
  const playback = useScrollPlayback(card);
  const beat = useBeats(beats, playback);
  const [hovered, setHovered] = useState<string | null>(null);
  const named = (idea: Idea) => (hovered === null ? beat >= namedBeat[idea] : hovered === idea);
  const spelledOut = (idea: Idea) => hovered === idea;

  return (
    <Figure
      caption="a better name does the comment's job, and that's what the next agent copies."
      waiting={playback === "waiting"}
    >
      <Card ref={card}>
        <div
          onPointerOver={(event) => setHovered(hoveredData(event, "idea"))}
          onPointerLeave={() => setHovered(null)}
          className="grid items-center gap-x-m gap-y-xs sm:grid-cols-[112px_1fr] sm:gap-y-m"
        >
          <Row label="without rodeo" shown={beat >= 0}>
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
          <Row label="rodeo" shown={beat >= rodeoBeat}>
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
      </Card>
    </Figure>
  );
}
