import { useRef, useState, type ReactNode } from "react";

import { Figure } from "@/components/figures/figure";
import { useBeats } from "@/hooks/use-beats";
import { useScrollPlayback } from "@/hooks/use-scroll-playback";
import { hoveredData } from "@/lib/hover";
import { cn } from "@/lib/utils";

type Idea = "edit" | "author" | "admin";

const ideas: Idea[] = ["edit", "author", "admin"];
const beats = [600, 500, 500, 700];
const struckBeat = ideas.length;

function Mark({
  idea,
  lit,
  children,
}: {
  idea: Idea;
  lit: (idea: Idea) => boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-idea={idea}
      className={cn(
        "-mx-0.5 cursor-default rounded-xs px-0.5 transition-colors duration-300 ease-(--motion-large-easing)",
        lit(idea) && "bg-primary-transparent text-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-xs rounded-m bg-card px-m py-s">
      <p className="text-xs text-muted-foreground">{label}</p>
      <pre className="font-data text-s whitespace-pre-wrap text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function RenameFigure() {
  const card = useRef<HTMLDivElement>(null);
  const beat = useBeats(beats, useScrollPlayback(card));
  const struck = beat >= struckBeat;
  const [hovered, setHovered] = useState<string | null>(null);
  const inComment = (idea: Idea) => hovered === idea || (beat >= ideas.indexOf(idea) && !struck);
  const inCode = (idea: Idea) => hovered === idea || beat >= ideas.indexOf(idea);

  return (
    <Figure caption="a better name does the comment's job, and that's what the next agent copies.">
      <div
        ref={card}
        onPointerOver={(event) => setHovered(hoveredData(event, "idea"))}
        onPointerLeave={() => setHovered(null)}
        className="space-y-xs rounded-l bg-background p-xs ring ring-border"
      >
        <Panel label="Before">
          <span
            className={cn(
              "line-through decoration-transparent transition-colors duration-500 ease-(--motion-large-easing)",
              struck && "text-muted-foreground decoration-muted-foreground",
            )}
          >
            {"// Only the "}
            <Mark idea="author" lit={inComment}>
              author
            </Mark>
            {" or an "}
            <Mark idea="admin" lit={inComment}>
              admin
            </Mark>
            {" can "}
            <Mark idea="edit" lit={inComment}>
              edit
            </Mark>
          </span>
          {'\nif (user.id === post.authorId || user.role === "admin") {'}
        </Panel>
        <Panel label="After">
          {"const "}
          <Mark idea="edit" lit={inCode}>
            canEdit
          </Mark>
          {" = "}
          <Mark idea="author" lit={inCode}>
            isAuthor
          </Mark>
          {"(user, post) || "}
          <Mark idea="admin" lit={inCode}>
            isAdmin
          </Mark>
          {"(user);\nif ("}
          <Mark idea="edit" lit={inCode}>
            canEdit
          </Mark>
          {") {"}
        </Panel>
      </div>
    </Figure>
  );
}
