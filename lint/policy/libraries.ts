import { kitStandIn, type Probe, type PolicyTopic, type RejectedProbe } from "./probe";

const rejected: RejectedProbe[] = [
  {
    name: "classic Zod imports",
    rule: "eslint(no-restricted-imports)",
    source: `import { z } from "zod";
export const schema = z.object({ id: z.string() });`,
  },
  {
    name: "icon libraries other than Hugeicons, at any import depth",
    rule: "eslint(no-restricted-imports)",
    source: `import { CheckIcon } from "@heroicons/react/24/outline";
export function Probe() { return <CheckIcon aria-hidden="true" />; }`,
  },
  {
    name: "skeleton libraries other than skullet",
    rule: "eslint(no-restricted-imports)",
    source: `import LoadingSkeleton from "react-loading-skeleton";
export function Probe() { return <LoadingSkeleton count={3} />; }`,
  },
  {
    name: "number and text animation libraries other than torph",
    rule: "eslint(no-restricted-imports)",
    source: `import NumberFlow from "@number-flow/react";
export function Probe({ total }: { total: number }) { return <NumberFlow value={total} />; }`,
  },
  {
    name: "the Next.js adapter for glimm",
    rule: "eslint(no-restricted-imports)",
    source: `import { TransitionLink } from "glimm/next";
export function Probe() { return <TransitionLink href="/">Home</TransitionLink>; }`,
  },
  {
    name: "classic Zod imports in src/lib",
    rule: "eslint(no-restricted-imports)",
    layer: "src/lib",
    source: `import { z } from "zod";
export const schema = z.object({ id: z.string() });`,
  },
];

const allowed: Probe[] = [
  {
    name: "text that morphs in place and skeletons drawn from the real component",
    source: `import { use, useState } from "react";
import { Skeleton, SkeletonBox, SkeletonSuspense } from "skullet/react";
import { TextMorph } from "torph/react";
import { ProbeButton } from "${kitStandIn}";
interface Profile { name: string; bio: string }
const sampleProfile: Profile = { name: "Sample Person", bio: "One line about this person." };
function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="space-y-xs rounded-m bg-card p-m">
      <h2 className="text-l font-heavy">{profile.name}</h2>
      <p className="text-s text-muted-foreground">{profile.bio}</p>
    </article>
  );
}
function StreamedProfile({ profile }: { profile: Promise<Profile> }) {
  return <ProfileCard profile={use(profile)} />;
}
export function Streamed({ profile }: { profile: Promise<Profile> }) {
  return (
    <SkeletonSuspense skeleton={<ProfileCard profile={sampleProfile} />} label="Loading profile">
      <StreamedProfile profile={profile} />
    </SkeletonSuspense>
  );
}
export function Fetched({ profile }: { profile: Profile | null }) {
  return (
    <Skeleton data={profile} sample={sampleProfile} label="Loading profile">
      {(loaded) => <ProfileCard profile={loaded} />}
    </Skeleton>
  );
}
export function ChartPlaceholder() {
  return <SkeletonBox width="100%" height={240} />;
}
export function CopyButton() {
  const [copied, setCopied] = useState(false);
  return (
    <ProbeButton onClick={() => setCopied(true)}>
      <TextMorph>{copied ? "Copied" : "Copy"}</TextMorph>
    </ProbeButton>
  );
}
export function Total({ total }: { total: number }) {
  return (
    <p className="text-xl font-heavy tabular-nums">
      <TextMorph>{\`$\${total.toLocaleString("en")}\`}</TextMorph>
    </p>
  );
}`,
  },
  {
    name: "a sweep on a milestone, across the page and inside one card",
    source: `import { useNavigate } from "@tanstack/react-router";
import { GlimmProvider, GlimmScope, useGlimm, type GlimmScopeHandle } from "glimm/react";
import { useRef, useState, type ReactNode } from "react";
import { ProbeButton } from "${kitStandIn}";
export function CheckoutLayout({ children, theme }: { children: ReactNode; theme: "light" | "dark" }) {
  return (
    <GlimmProvider palette="prism" brightness={theme === "dark" ? 0.85 : 1}>
      {children}
    </GlimmProvider>
  );
}
export function PublishButton() {
  const navigate = useNavigate();
  const { sweep } = useGlimm();
  return (
    <ProbeButton onClick={() => sweep(() => navigate({ to: "/", viewTransition: false }))}>
      Publish
    </ProbeButton>
  );
}
export function PlanCard() {
  const scope = useRef<GlimmScopeHandle>(null);
  const [plan, setPlan] = useState("Free");
  return (
    <div className="h-[200px] *:h-full">
      <GlimmScope ref={scope} curve={0.06} bandTight={34}>
        <article className="h-full rounded-m bg-card p-m">
          <p className="text-l font-heavy">{plan}</p>
          <ProbeButton onClick={() => scope.current?.play({ change: () => setPlan("Pro") })}>
            Upgrade
          </ProbeButton>
        </article>
      </GlimmScope>
    </div>
  );
}`,
  },
];

export const libraryProbes: PolicyTopic = { rejected, allowed };
