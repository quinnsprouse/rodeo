export type Probe = {
  name: string;
  source: string;
  layer?: string;
  file?: string;
  extraFiles?: Record<string, string>;
};
export type RejectedProbe = Probe & { rule: string; help?: string };
export type PolicyTopic = { rejected: RejectedProbe[]; allowed?: Probe[] };

export const layerPrefix = ".policy-probe-";
const layerProbeName = `${layerPrefix}${process.pid}`;
export const kitStandIn = `@/components/ui/${layerProbeName}/probe-button`;
export const appStandIn = `@/components/${layerProbeName}/probe-badge`;

export const standIns: Probe[] = [
  {
    name: "a kit component",
    layer: "src/components/ui",
    file: "probe-button.tsx",
    source: `import type { ComponentProps } from "react";
export function ProbeButton(props: ComponentProps<"button">) {
  return <button type="button" {...props} />;
}`,
  },
  {
    name: "an app component",
    layer: "src/components",
    file: "probe-badge.tsx",
    source: `export function ProbeBadge() { return <span aria-hidden="true" />; }`,
  },
];
