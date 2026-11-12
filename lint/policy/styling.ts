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
  {
    name: "CSS borders in the kit, which the theme draws as box shadows",
    rule: "rodeo(no-off-theme-classes)",
    layer: "src/components/ui",
    source: `export function Probe() { return <div className="border border-input" />; }`,
  },
  {
    name: "transition-all",
    rule: "rodeo(no-off-theme-classes)",
    source: `export function Probe() { return <p className="transition-all">Ready</p>; }`,
  },
  {
    name: "removing the focus outline without a focus-visible replacement",
    rule: "rodeo(no-off-theme-classes)",
    source: `export function Probe() { return <a href="/" className="outline-none">Home</a>; }`,
  },
  {
    name: "logical sizes whose names the spacing scale shadows",
    rule: "rodeo(no-off-theme-classes)",
    source: `export function Probe() { return <main className="max-inline-xl">Ready</main>; }`,
  },
];

const allowed: Probe[] = [
  {
    name: "themed edges, named transitions, and a replaced focus outline",
    layer: "src/components/ui",
    source: `export function Probe() {
  return (
    <div className="ring-1 ring-border divider-b transition-colors duration-(--motion-duration) ease-(--motion-easing)">
      <span className="max-w-xl outline-none focus-visible:inset-ring-primary-transparent" />
    </div>
  );
}`,
  },
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
