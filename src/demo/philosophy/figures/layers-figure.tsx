import type { ReactNode } from "react";

import { concealed, iconOut, iconSwap, reveal } from "@/demo/motion-classes";
import { Figure, timeline, useFigure } from "@/demo/philosophy/figures/figure";
import { useHoveredData } from "@/demo/use-hovered-data";
import { cn } from "@/lib/utils";

const folders = ["routes", "components", "hooks", "lib"] as const;
type Folder = (typeof folders)[number];

const chip = { left: 56, width: 112, height: 28, gap: 24 };
const pitch = chip.height + chip.gap;
const diagram = { width: chip.left * 2 + chip.width, height: folders.length * pitch - chip.gap };
const viewBox = `0 0 ${diagram.width} ${diagram.height}`;
const center = chip.left + chip.width / 2;

type Side = "left" | "right";
const edgeOf = { left: chip.left - 4, right: chip.left + chip.width + 4 };
const outward = { left: -1, right: 1 };
const opposite = { left: "right", right: "left" } as const;

interface Edge {
  from: Folder;
  to: Folder;
  path: string;
}

function middle(folder: Folder) {
  return folders.indexOf(folder) * pitch + chip.height / 2;
}

function barbs(x: number, y: number, side: Side) {
  const back = x + outward[side] * 5;
  return `L${back} ${y - 4} L${x} ${y} L${back} ${y + 4}`;
}

function down(from: Folder, to: Folder): Edge {
  const start = middle(from) + chip.height / 2 + 4;
  const end = middle(to) - chip.height / 2 - 4;
  const head = `L${center - 4} ${end - 4} L${center} ${end} L${center + 4} ${end - 4}`;
  return { from, to, path: `M${center} ${start} V${end} ${head}` };
}

function arc(from: Folder, to: Folder, side: Side, { leave = 0, arrive = 0 } = {}) {
  const x = edgeOf[side];
  const start = middle(from) + leave;
  const end = middle(to) + arrive;
  const reach = x + outward[side] * (14 + Math.abs(start - end) * 0.3);
  return {
    from,
    to,
    path: `M${x} ${start} C${reach} ${start}, ${reach} ${end}, ${x} ${end} ${barbs(x, end, side)}`,
    midpoint: { x: (x + 3 * reach) / 4, y: (start + end) / 2 },
  };
}

function weave(
  from: Folder,
  to: Folder,
  {
    startsOn,
    under,
    leave = 0,
    arrive = 0,
    swing = 44,
  }: {
    startsOn: Side;
    under: Folder;
    leave?: number;
    arrive?: number;
    swing?: number;
  },
): Edge {
  const endsOn = opposite[startsOn];
  const start = middle(from) + leave;
  const end = middle(to) + arrive;
  const gap = middle(under) + pitch / 2;
  const far = edgeOf[startsOn] + outward[startsOn] * swing;
  const across = `C${far} ${start}, ${far} ${gap}, ${center} ${gap}`;
  const back = `S${2 * center - far} ${end}, ${edgeOf[endsOn]} ${end}`;
  return {
    from,
    to,
    path: `M${edgeOf[startsOn]} ${start} ${across} ${back} ${barbs(edgeOf[endsOn], end, endsOn)}`,
  };
}

const downward = [down("routes", "components"), down("components", "hooks"), down("hooks", "lib")];

const withoutRodeo = {
  name: "without rodeo",
  outcome: "anything can import anything.",
  edges: [
    ...downward,
    weave("hooks", "routes", { startsOn: "left", under: "routes", leave: -4, arrive: 4 }),
    weave("lib", "components", { startsOn: "left", under: "hooks", leave: 4, arrive: 4 }),
    weave("lib", "routes", { startsOn: "right", under: "components", leave: -5, arrive: -6 }),
    arc("components", "routes", "left", { leave: -5, arrive: 6 }),
    arc("lib", "hooks", "right", { leave: 6, arrive: 4 }),
    arc("hooks", "components", "right", { leave: -6, arrive: -6 }),
  ],
  stroke: "stroke-neutral-6",
  steps: [
    "delay-0",
    "delay-60",
    "delay-120",
    "delay-180",
    "delay-240",
    "delay-300",
    "delay-360",
    "delay-420",
    "delay-480",
  ],
};

const rodeo = {
  name: "rodeo",
  outcome: "an import that points back up fails lint.",
  edges: downward,
  stroke: "stroke-primary",
  steps: ["delay-0", "delay-180", "delay-360"],
};

const refused = arc("lib", "components", "right");
const refusal = refused.midpoint;

const beats = timeline({ folders: 150, tangle: 450, oneWay: 1000, attempt: 800, refused: 450 });

const chipSteps = ["delay-0", "delay-60", "delay-120", "delay-180"];
const focusFade = "transition-opacity duration-(--motion-duration) ease-(--motion-easing)";

function Arrow({
  edge,
  stroke,
  drawn,
  step,
  focused,
  children,
}: {
  edge: Edge;
  stroke: string;
  drawn: boolean;
  step?: string | undefined;
  focused: string | null;
  children?: ReactNode;
}) {
  return (
    <g className={cn(focusFade, focused !== null && focused !== edge.from && "opacity-20")}>
      <path
        d={edge.path}
        pathLength={1}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("draw", stroke, step, !drawn && "draw-hidden")}
      />
      {children}
    </g>
  );
}

function Stack({
  stack: { name, outcome, edges, stroke, steps },
  shown,
  drawn,
  concluded,
  focused,
  children,
}: {
  stack: typeof rodeo;
  shown: boolean;
  drawn: boolean;
  concluded: boolean;
  focused: string | null;
  children?: ReactNode;
}) {
  const reached = new Set(edges.filter((edge) => edge.from === focused).map((edge) => edge.to));
  const lit = (folder: Folder) => focused === null || focused === folder || reached.has(folder);

  return (
    <div className="mx-auto w-56 text-center">
      <p className="text-s text-foreground">{name}</p>
      <div className="relative mt-s h-46">
        <ol className="ml-14 flex w-28 flex-col gap-6 text-left font-data text-xs text-foreground">
          {folders.map((folder, index) => (
            <li
              key={folder}
              data-folder={folder}
              className={cn(
                "flex h-7 cursor-default items-center rounded-s bg-muted px-s",
                focusFade,
                !lit(folder) && "opacity-40",
              )}
            >
              <span className={cn(reveal, chipSteps[index], !shown && concealed)}>{folder}</span>
            </li>
          ))}
        </ol>
        <svg
          viewBox={viewBox}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {edges.map((edge, index) => (
            <Arrow
              key={edge.path}
              edge={edge}
              stroke={stroke}
              drawn={drawn}
              step={steps[index]}
              focused={focused}
            />
          ))}
          {children}
        </svg>
      </div>
      <p className={cn("mt-s text-xs text-muted-foreground", reveal, !concluded && concealed)}>
        {outcome}
      </p>
    </div>
  );
}

export function LayersFigure() {
  const figure = useFigure(beats);
  const { beat } = figure;
  const { hovered: focused, handlers } = useHoveredData("folder");
  const shown = beat >= beats.at("folders");
  const stopped = beat >= beats.at("refused");

  return (
    <Figure figure={figure} caption="the same four folders, and which way their imports can point.">
      <div {...handlers} className="grid gap-l sm:grid-cols-2">
        <Stack
          stack={withoutRodeo}
          shown={shown}
          drawn={beat >= beats.at("tangle")}
          concluded={beat >= beats.at("tangle")}
          focused={focused}
        />
        <Stack
          stack={rodeo}
          shown={shown}
          drawn={beat >= beats.at("oneWay")}
          concluded={stopped}
          focused={focused}
        >
          <Arrow
            edge={refused}
            stroke="stroke-destructive"
            drawn={beat >= beats.at("attempt")}
            focused={focused}
          >
            <g className={cn("origin-center transform-fill", iconSwap, !stopped && iconOut)}>
              <circle cx={refusal.x} cy={refusal.y} r={8} className="fill-destructive" />
              <path
                d={`M${refusal.x - 3} ${refusal.y - 3} l6 6 m0 -6 l-6 6`}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="stroke-destructive-foreground"
              />
            </g>
          </Arrow>
        </Stack>
      </div>
    </Figure>
  );
}
