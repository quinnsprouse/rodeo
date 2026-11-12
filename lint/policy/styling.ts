import { kitStandIn, type Probe, type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "raw palette colors outside the theme",
    rule: "shadcn(no-raw-colors)",
    source: `export function Probe() { return <span className="bg-emerald-500" />; }`,
  },
  {
    name: "hex colors in app components",
    rule: "shadcn(no-raw-colors)",
    layer: "src/components",
    source: `export function Probe() { return <svg aria-hidden="true"><path fill="#863bff" d="M0 0h4v4z" /></svg>; }`,
  },
  {
    name: "arbitrary appearance values",
    rule: "shadcn(no-arbitrary-values)",
    source: `export function Probe() { return <p className="text-[13px]">Ready</p>; }`,
  },
  {
    name: "padding on a kit component, even from the theme scale",
    rule: "shadcn(no-restyle)",
    source: `import { ProbeButton } from "${kitStandIn}";
export function Probe() { return <ProbeButton className="px-l">Save</ProbeButton>; }`,
  },
  {
    name: "restyling a kit component",
    rule: "shadcn(no-restyle)",
    source: `import { ProbeButton } from "${kitStandIn}";
export function Probe() { return <ProbeButton className="bg-brand">Save</ProbeButton>; }`,
  },
  {
    name: "inline style properties",
    rule: "shadcn(no-inline-styles)",
    source: `export function Probe({ value }: { value: number }) { return <div style={{ width: \`\${value}%\` }} />; }`,
  },
  {
    name: "Tailwind default scales the theme replaced",
    rule: "shadcn(no-unknown-classes)",
    source: `export function Probe() { return <p className="text-sm font-bold">Ready</p>; }`,
  },
  {
    name: "classes Tailwind cannot generate",
    rule: "shadcn(no-unknown-classes)",
    source: `export function Probe() { return <span className="rounded-huge" />; }`,
  },
];

const allowed: Probe[] = [
  {
    name: "dynamic values through CSS custom properties",
    source: `export function Probe({ value, fade }: { value: number; fade: number }) {
  return (
    <div
      className="w-(--progress) opacity-(--fade)"
      style={{ "--progress": \`\${value}%\`, "--fade": fade }}
    />
  );
}`,
  },
  {
    name: "fixed colors in sticker artwork",
    layer: "src/components/stickers",
    source: `export function Probe() { return <svg aria-hidden="true"><path fill="#863bff" d="M0 0h4v4z" /></svg>; }`,
  },
];

export const stylingProbes: PolicyTopic = { rejected, allowed };
