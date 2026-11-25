import { kitStandIn, type Probe, type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "a native button where the kit has Button",
    rule: "design-system(no-rebuilt-primitives)",
    source: `export function Probe({ onSave }: { onSave: () => void }) {
  return <button type="button" onClick={onSave}>Save</button>;
}`,
  },
  {
    name: "a UI SDK part imported outside the kit",
    rule: "design-system(wrapped-libraries)",
    layer: "src/components",
    source: `import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
export function Probe() {
  return (
    <Switch aria-label="Notifications">
      <SwitchThumb />
    </Switch>
  );
}`,
  },
  {
    name: "a kit variant typed as any string",
    rule: "design-system(closed-variants)",
    layer: "src/components/ui",
    source: `export function Probe({ variant }: { variant: string }) {
  return <span data-variant={variant} />;
}`,
  },
  {
    name: "a kit component named for a page and a tier",
    rule: "design-system(primitive-naming)",
    layer: "src/components/ui",
    file: "pricing-card-pro.tsx",
    source: `export function PricingCardPro() { return <section aria-label="Pro plan" />; }`,
  },
  {
    name: "a kit look chosen with a boolean prop",
    rule: "design-system(no-boolean-variants)",
    layer: "src/components/ui",
    source: `export function Probe({ isPrimary }: { isPrimary?: boolean }) {
  return <span data-primary={isPrimary} />;
}`,
  },
  {
    name: "a class forced with the important modifier",
    rule: "design-system(no-important)",
    source: `export function Probe() { return <p className="mt-m!">Ready</p>; }`,
  },
  {
    name: "a class that styles the inside of a kit component",
    rule: "design-system(no-reach-in-selectors)",
    source: `import { ProbeButton } from "${kitStandIn}";
export function Probe() { return <ProbeButton className="[&_svg]:size-4">Save</ProbeButton>; }`,
  },
  {
    name: "an icon-only Button with no name",
    rule: "design-system(icon-button-label)",
    source: `import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
export function Probe({ onSave }: { onSave: () => void }) {
  return (
    <Button size="icon" onClick={onSave}>
      <Icon icon={Tick02Icon} />
    </Button>
  );
}`,
  },
];

const allowed: Probe[] = [
  {
    name: "a named icon Button with the quiet variant, placed by its className",
    source: `import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
export function Probe({ onSave }: { onSave: () => void }) {
  return (
    <Button variant="quiet" size="icon" aria-label="Save" onClick={onSave} className="mt-m size-10">
      <Icon icon={Tick02Icon} aria-hidden="true" />
    </Button>
  );
}`,
  },
  {
    name: "a kit component wrapping a UI SDK part with closed variants",
    layer: "src/components/ui",
    source: `import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
type ProbeSwitchProps = ComponentProps<typeof Switch> & { size?: "default" | "small"; disabled?: boolean };
export function ProbeSwitch({ size = "default", className, ...props }: ProbeSwitchProps) {
  return (
    <Switch data-size={size} className={cn("inline-flex rounded-full bg-muted", className)} {...props}>
      <SwitchThumb className="block rounded-full bg-background" />
    </Switch>
  );
}`,
  },
];

export const designSystemProbes: PolicyTopic = { rejected, allowed };
