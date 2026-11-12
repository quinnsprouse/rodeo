import { appStandIn, kitStandIn, type Probe, type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "src/lib importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "src/hooks importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/hooks",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "the UI kit importing an app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components/ui",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "importing a route module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Route } from "@/routes/index";\nexport const route = Route;`,
  },
  {
    name: "a server module in src/lib importing a component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "component-import.server.ts",
    source: `import { Wordmark } from "@/components/wordmark";\nexport const mark = Wordmark;`,
  },
  {
    name: "src/lib importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "src/config importing a nested app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/config",
    source: `import { BullSticker } from "@/components/stickers/bull";\nexport const sticker = BullSticker;`,
  },
  {
    name: "src/config importing a nested hook module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/config",
    source: `import { useTheme } from "@/hooks/theme/use-theme";\nexport const theme = useTheme;`,
  },
  {
    name: "src/hooks importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/hooks",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "the UI kit importing a nested app component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components/ui",
    source: `import { BullSticker } from "@/components/stickers/bull";\nexport const sticker = BullSticker;`,
  },
  {
    name: "a server module in src/lib importing a nested kit component",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "nested-component-import.server.ts",
    source: `import { Button } from "@/components/ui/button";\nexport const button = Button;`,
  },
  {
    name: "importing a nested route module",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Route } from "@/routes/(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "a kit component importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/components",
    source: `import { Hero } from "@/demo/landing/hero";\nexport const hero = Hero;`,
  },
  {
    name: "src/lib importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { reveal } from "@/demo/motion-classes";\nexport const entrance = reveal;`,
  },
  {
    name: "a server module in src/lib importing the demo",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    file: "demo-import.server.ts",
    source: `import { reveal } from "@/demo/motion-classes";\nexport const entrance = reveal;`,
  },
  {
    name: "the relative demo import a file at the src root would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import { Hero } from "./demo/landing/hero";\nexport const hero = Hero;`,
  },
  {
    name: "a relative import of the whole demo folder",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import * as demo from "./demo";\nexport const loaded = demo;`,
  },
  {
    name: "the relative demo routes import a file at the src root would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src",
    source: `import { Route } from "./routes/(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "the relative demo route import a route would write",
    rule: "eslint(no-restricted-imports)",
    layer: "src/routes",
    source: `import { Route } from "./(demo)/philosophy";\nexport const route = Route;`,
  },
  {
    name: "nested Node built-in paths in client code",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { readFile } from "node:fs/promises";\nexport const read = readFile;`,
  },
  {
    name: "Node built-ins in client code",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { readFileSync } from "node:fs";\nexport const read = readFileSync;`,
  },
  {
    name: "process.env in client code",
    rule: "eslint(no-restricted-globals)",
    layer: "src/lib",
    source: `export const apiKey = process.env.API_KEY;`,
  },
];

const allowed: Probe[] = [
  {
    name: "Node code in a server module",
    layer: "src/lib",
    file: "secrets.server.ts",
    source: `import { env } from "node:process";
export const apiKey = env.API_KEY;
export const region = process.env.REGION;`,
  },
  {
    name: "kit and Icon imports inside the kit",
    layer: "src/components/ui",
    source: `import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { ProbeButton } from "${kitStandIn}";
export const parts = { Copy01Icon, Icon, ProbeButton };`,
  },
  {
    name: "nested kit and app component imports in an app component",
    layer: "src/components",
    source: `import { ProbeBadge } from "${appStandIn}";
import { ProbeButton } from "${kitStandIn}";
export function Probe() {
  return (
    <ProbeButton>
      <ProbeBadge />
      Save
    </ProbeButton>
  );
}`,
  },
];

export const layerProbes: PolicyTopic = { rejected, allowed };
