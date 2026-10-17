import type { ReactNode } from "react";

import { PyramidSlices, pyramidSlices } from "@/components/pyramid-slices";
import { TerminalDemo } from "@/components/terminal-demo";
import { cn } from "@/lib/utils";

function Figure({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="py-s">
      {children}
      <figcaption className="mt-s text-center text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-l bg-background p-l ring ring-border", className)}>{children}</div>
  );
}

export function PyramidFigure() {
  return (
    <Figure caption="most of the work happens at the top.">
      <Card className="flex items-center justify-center gap-xl py-xl">
        <PyramidSlices className="w-[180px] sm:w-[220px]" />
        <ul className="flex h-[140px] flex-col justify-around text-s sm:h-[173px]">
          {pyramidSlices.map((slice) => (
            <li
              key={slice.name}
              className={
                slice.name === "Human review" ? "text-muted-foreground" : "text-foreground"
              }
            >
              {slice.name}
            </li>
          ))}
        </ul>
      </Card>
    </Figure>
  );
}

export function TerminalFigure() {
  return (
    <Figure caption="the error says how to fix it, so the agent fixes it before you ever see the diff.">
      <TerminalDemo />
    </Figure>
  );
}

const overhead = [
  { label: "reading comments", swatch: "bg-muted-foreground", grow: "grow-[84]" },
  { label: "fixing unit tests", swatch: "bg-neutral-6", grow: "grow-[110]" },
  { label: "reading docs", swatch: "bg-neutral-4", grow: "grow-[76]" },
];

export function TokenBarsFigure() {
  return (
    <Figure caption="where an agent's tokens go on one change. an illustration, not a benchmark.">
      <Card className="space-y-m">
        <div className="grid grid-cols-[96px_1fr] items-center gap-m text-s sm:grid-cols-[112px_1fr]">
          <span className="text-foreground">most codebases</span>
          <div className="flex h-[28px] gap-0.5 overflow-hidden rounded-s">
            <span className="grow-[96] bg-primary" />
            {overhead.map((item) => (
              <span key={item.label} className={cn(item.grow, item.swatch)} />
            ))}
          </div>
          <span className="text-foreground">rodeo</span>
          <div className="flex h-[28px] w-[30%] gap-0.5 overflow-hidden rounded-s">
            <span className="grow-[96] bg-primary" />
            <span className="grow-[14] bg-neutral-4" />
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-l gap-y-xs text-xs text-muted-foreground sm:pl-32">
          <li className="flex items-center gap-xs">
            <span className="size-2.5 rounded-xs bg-primary" aria-hidden="true" />
            the actual task
          </li>
          {overhead.map((item) => (
            <li key={item.label} className="flex items-center gap-xs">
              <span className={cn("size-2.5 rounded-xs", item.swatch)} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </Card>
    </Figure>
  );
}

export function UpkeepFigure() {
  return (
    <Figure caption="the overhead piles up because every change has to read and fix more of it. also an illustration.">
      <Card>
        <p className="text-xs text-muted-foreground">tokens spent on upkeep, per change</p>
        <svg viewBox="0 0 512 180" aria-hidden="true" className="mt-s w-full">
          <line x1="0" y1="172" x2="512" y2="172" className="stroke-neutral-4" strokeWidth={1} />
          <path
            d="M6 164 C 170 160, 330 118, 496 18"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-muted-foreground"
          />
          <circle cx="496" cy="18" r="4.5" className="fill-muted-foreground" />
          <path
            d="M6 164 C 190 160, 360 154, 496 146"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-primary"
          />
          <circle cx="496" cy="146" r="4.5" className="fill-primary" />
        </svg>
        <div className="mt-xs flex justify-between text-xs text-muted-foreground">
          <span>day one</span>
          <span>a year in</span>
        </div>
        <ul className="mt-s flex gap-l text-xs text-muted-foreground">
          <li className="flex items-center gap-xs">
            <span className="h-[3px] w-3.5 rounded-xs bg-muted-foreground" aria-hidden="true" />
            most codebases
          </li>
          <li className="flex items-center gap-xs">
            <span className="h-[3px] w-3.5 rounded-xs bg-primary" aria-hidden="true" />
            rodeo
          </li>
        </ul>
      </Card>
    </Figure>
  );
}

const before = `// Only the author or an admin can edit
if (user.id === post.authorId || user.role === "admin") {`;
const after = `const canEdit = isAuthor(user, post) || isAdmin(user);
if (canEdit) {`;

export function BeforeAfterFigure() {
  return (
    <Figure caption="a better name does the comment's job, and that's what the next agent copies.">
      <Card className="space-y-m">
        {[
          { label: "Before", code: before },
          { label: "After", code: after },
        ].map(({ label, code }) => (
          <div key={label} className="space-y-xs [&+&]:pt-m [&+&]:divider-t">
            <p className="text-xs text-muted-foreground">{label}</p>
            <pre className="font-data text-s whitespace-pre-wrap text-foreground">
              <code>{code}</code>
            </pre>
          </div>
        ))}
      </Card>
    </Figure>
  );
}

const exits = [
  { rule: "lint exception", exit: "An entry in vite.config.ts with a why: comment" },
  { rule: "comment", exit: "why: plus the dependency, browser, or spec, in 6 to 30 words" },
  { rule: "skipping a hook", exit: "Only a person can" },
];

export function EscapeHatchesFigure() {
  return (
    <Figure caption="one way out per rule, and it always leaves a reason.">
      <Card>
        <dl className="grid gap-x-m gap-y-s text-s sm:grid-cols-[150px_1fr]">
          {exits.map(({ rule, exit }) => (
            <div key={rule} className="contents">
              <dt className="font-data text-foreground">{rule}</dt>
              <dd className="mb-xs text-muted-foreground sm:mb-0">{exit}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </Figure>
  );
}
