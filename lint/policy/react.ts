import { kitStandIn, type Probe, type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "checked inputs without a change handler or read-only intent",
    rule: "react(checked-requires-onchange-or-readonly)",
    source: `export function Probe() {
return <input type="checkbox" aria-label="Notifications" checked />;
}`,
  },
  {
    name: "buttons with implicit submit behavior",
    rule: "react(button-has-type)",
    source: `export function Probe() { return <button>Cancel</button>; }`,
  },
  {
    name: "missing effect dependencies",
    rule: "react-hooks-js(exhaustive-deps)",
    source: `import { useEffect } from "react";
export function Probe({ title }: { title: string }) {
useEffect(() => { document.title = title; }, []);
return null;
}`,
  },
  {
    name: "conditional hooks",
    rule: "react-hooks-js(rules-of-hooks)",
    source: `import { useEffect } from "react";
export function Probe({ enabled }: { enabled: boolean }) {
if (enabled) useEffect(() => { document.title = "Ready"; }, []);
return null;
}`,
  },
  {
    name: "derived state synchronized through an effect",
    rule: "react-hooks-js(set-state-in-effect)",
    source: `import { useEffect, useState } from "react";
export function Probe({ name }: { name: string }) {
const [label, setLabel] = useState("");
useEffect(() => { setLabel(name.toUpperCase()); }, [name]);
return <span>{label}</span>;
}`,
  },
  {
    name: "async effect callbacks",
    rule: "react-hooks-js(exhaustive-deps)",
    source: `import { useEffect } from "react";
export function Probe() {
useEffect(async () => { await Promise.resolve(); }, []);
return null;
}`,
  },
  {
    name: "a try without a catch in a component",
    rule: "react-hooks-js(todo)",
    source: `import { useState } from "react";
export function Probe({ save }: { save: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try { await save(); } finally { setSaving(false); }
  }
  return <button type="button" disabled={saving} onClick={() => void submit()}>Save</button>;
}`,
  },
  {
    name: "a label with no control",
    rule: "jsx-a11y(label-has-associated-control)",
    source: `export function Probe() { return <label className="text-s">Bill yearly</label>; }`,
  },
  {
    name: "components React Compiler cannot compile",
    rule: "react-hooks-js(todo)",
    source: `import { lazy } from "react";
export function Probe() {
const Panel = lazy(() => import("./panel"));
return <Panel />;
}`,
  },
];

const allowed: Probe[] = [
  {
    name: "a pending flag from useTransition around an async submit",
    source: `import { useTransition } from "react";
export function Probe({ save }: { save: () => Promise<void> }) {
  const [saving, startSaving] = useTransition();
  return (
    <button type="button" disabled={saving} onClick={() => startSaving(async () => { await save(); })}>
      Save
    </button>
  );
}`,
  },
  {
    name: "a label wrapped around a Base UI control",
    source: `import { Checkbox } from "@base-ui/react/checkbox";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Switch } from "@base-ui/react/switch";
export function Probe() {
  return (
    <>
      <label className="flex gap-xs"><Switch.Root name="yearly" /> Bill yearly</label>
      <label className="flex gap-xs"><Checkbox.Root name="terms" /> Accept the terms</label>
      <RadioGroup name="plan">
        <label className="flex gap-xs"><Radio.Root value="pro" /> Pro</label>
      </RadioGroup>
    </>
  );
}`,
  },
  {
    name: "explicit behavior and external synchronization with cleanup",
    source: `import { useEffect, useState } from "react";
import * as z from "zod/mini";
import { ProbeButton } from "${kitStandIn}";
export const itemSchema = z.object({ id: z.string(), tab: z.catch(z.enum(["a", "b"]), "a") });
export function Probe({ delay }: { delay: number }) {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTicks((value) => value + 1), delay);
    return () => window.clearInterval(timer);
  }, [delay]);
  return <button type="button">{ticks}</button>;
}
export function label(status: "ready" | "failed") {
  switch (status) {
    case "ready": return "Ready";
    case "failed": return "Failed";
  }
}
export function isEqual(left: string | number, right: string | number) {
  return left === right;
}
export function isAbsent(value: string | null | undefined) {
  return value == null;
}
export function save() {
  return Promise.reject(new Error("Failed to save"));
}
export async function attempt(action: () => Promise<void>) {
  try { await action(); } catch (error) { console.error(error); }
}
export async function removeCache(remove: () => Promise<void>) {
  try { await remove(); } catch {
    // why: Cache removal is best-effort, and a failure must not block signing out.
  }
}
export function ReadOnly() {
  return <input type="checkbox" aria-label="Notifications" checked readOnly />;
}
export function Editable() {
  const [checked, setChecked] = useState(false);
  return <input type="checkbox" aria-label="Notifications" checked={checked}
    onChange={(event) => setChecked(event.currentTarget.checked)} />;
}
export function Themed() {
  return (
    <>
      <ProbeButton className="mt-m w-full">Save</ProbeButton>
      <p className="text-s font-medium text-success">Ready</p>
    </>
  );
}`,
  },
];

export const reactProbes: PolicyTopic = { rejected, allowed };
