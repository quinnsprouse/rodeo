import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/icon";
import { concealed, iconOut, iconSwap, reveal } from "@/demo/motion-classes";
import { Figure, timeline, useFigure } from "@/demo/philosophy/figures/figure";
import { Highlight } from "@/demo/philosophy/figures/highlight";
import { cn } from "@/lib/utils";

const exchanges = [
  {
    id: "color",
    label: "a raw color",
    wrote: { before: '<div className="', flagged: "bg-gray-100", after: '">' },
    said: {
      problem: '"bg-gray-100" uses the raw Tailwind palette. ',
      fix: "Use one of the theme colors",
      detail: ": accent, background, border...",
    },
  },
  {
    id: "input",
    label: "unchecked input",
    wrote: {
      before: "createServerFn().handler(\n  ({ ",
      flagged: "data",
      after: " }) => save(data))",
    },
    said: {
      problem: "This server function reads data without a validator. ",
      fix: "Add .validator(schema)",
      detail: " with a Zod schema before .handler()",
    },
  },
] as const;

type Exchange = (typeof exchanges)[number];

const beats = timeline({ color: 150, colorSaid: 500, input: 550, inputSaid: 500 });

function Row({
  exchange: { label, wrote, said },
  written,
  answered,
}: {
  exchange: Exchange;
  written: boolean;
  answered: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "mt-s text-s text-foreground first:mt-0 sm:mt-0 sm:pt-2.5",
          reveal,
          !written && concealed,
        )}
      >
        {label}
      </span>
      <div className="min-w-0 space-y-xs">
        <pre
          className={cn(
            "rounded-m bg-muted px-m py-s font-data text-xs leading-4.5 whitespace-pre-wrap text-foreground",
            reveal,
            !written && concealed,
          )}
        >
          <code>
            {wrote.before}
            <span
              className={cn(
                "underline decoration-wavy underline-offset-4 transition-colors duration-300 ease-(--motion-large-easing)",
                answered ? "decoration-destructive" : "decoration-transparent",
              )}
            >
              {wrote.flagged}
            </span>
            {wrote.after}
          </code>
        </pre>
        <p
          className={cn(
            "flex gap-xs text-xs text-muted-foreground",
            reveal,
            !answered && concealed,
          )}
        >
          <span
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-full bg-destructive text-destructive-foreground delay-100",
              iconSwap,
              !answered && iconOut,
            )}
          >
            <Icon icon={Cancel01Icon} size={10} aria-hidden="true" />
          </span>
          <span>
            {said.problem}
            <Highlight lit={answered} delay="delay-200" className="whitespace-nowrap">
              {said.fix}
            </Highlight>
            {said.detail}
          </span>
        </p>
      </div>
    </>
  );
}

export function LintFigure() {
  const figure = useFigure(beats);
  const { beat } = figure;

  return (
    <Figure
      figure={figure}
      caption="two things an agent wrote, and what lint said back. the messages are real, just trimmed."
    >
      <div className="grid items-start gap-x-m gap-y-xs sm:grid-cols-[112px_1fr] sm:gap-y-l">
        {exchanges.map((exchange) => (
          <Row
            key={exchange.id}
            exchange={exchange}
            written={beat >= beats.at(exchange.id)}
            answered={beat >= beats.at(`${exchange.id}Said`)}
          />
        ))}
      </div>
    </Figure>
  );
}
