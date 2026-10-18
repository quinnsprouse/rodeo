type DiffLineKind = "context" | "removed" | "added";

export interface DiffLine {
  number: number;
  kind: DiffLineKind;
  code: string;
}

export interface Scenario {
  value: string;
  label: string;
  shortLabel: string;
  prompt: string;
  stepsBefore: string[];
  caught: { title: string; detail: string };
  stepsAfter: string[];
  result: string;
  file: { path: string; summary: string; lines: DiffLine[] };
  status: string;
}

export const scenarios: Scenario[] = [
  {
    value: "edit",
    label: "Every edit",
    shortLabel: "Every edit",
    prompt: "Add a pricing page with live prices from Stripe.",
    stepsBefore: ["Read AGENTS.md", "Edit src/routes/pricing.tsx"],
    caught: {
      title: "process.env in browser code",
      detail: "Loaders run in the browser too. Move Stripe to a .server.ts file.",
    },
    stepsAfter: ["Move Stripe to prices.server.ts", "Format, lint, and types pass"],
    result: "Your pricing page is ready.",
    file: {
      path: "src/routes/pricing.tsx",
      summary: "−3 +2",
      lines: [
        {
          number: 1,
          kind: "context",
          code: 'import { createFileRoute } from "@tanstack/react-router";',
        },
        { number: 2, kind: "removed", code: 'import Stripe from "stripe";' },
        {
          number: 3,
          kind: "removed",
          code: "const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);",
        },
        { number: 2, kind: "added", code: 'import { getPrices } from "@/lib/prices";' },
        { number: 3, kind: "context", code: "" },
        { number: 4, kind: "context", code: 'export const Route = createFileRoute("/pricing")({' },
        {
          number: 6,
          kind: "removed",
          code: "  loader: () => stripe.prices.list({ active: true }),",
        },
        { number: 5, kind: "added", code: "  loader: () => getPrices()," },
        { number: 6, kind: "context", code: "  component: PricingPage," },
        { number: 7, kind: "context", code: "});" },
      ],
    },
    status: "Lint and types pass",
  },
  {
    value: "push",
    label: "Every push",
    shortLabel: "Every push",
    prompt: "Commit this and push it.",
    stepsBefore: ['Commit "feat(pricing): add a pricing page"', "Run git push"],
    caught: {
      title: "Unused export: formatPrice",
      detail: "Nothing imports it anymore. Delete it, or use it.",
    },
    stepsAfter: ["Delete formatPrice", "Build, dead code, and browser tests pass"],
    result: "Pushed to origin/pricing-page.",
    file: {
      path: "src/lib/format.ts",
      summary: "−4",
      lines: [
        { number: 1, kind: "context", code: "export function formatInterval(yearly: boolean) {" },
        { number: 2, kind: "context", code: '  return yearly ? "per year" : "per month";' },
        { number: 3, kind: "context", code: "}" },
        { number: 4, kind: "removed", code: "" },
        { number: 5, kind: "removed", code: "export function formatPrice(cents: number) {" },
        { number: 6, kind: "removed", code: "  return `$${(cents / 100).toFixed(2)}`;" },
        { number: 7, kind: "removed", code: "}" },
      ],
    },
    status: "Browser tests pass",
  },
  {
    value: "pull-request",
    label: "Every pull request",
    shortLabel: "Every PR",
    prompt: "Open a pull request.",
    stepsBefore: ["Open pull request #12", "Watch CI"],
    caught: {
      title: "CI: Cannot find module './prices.server'",
      detail: "The file was never committed. It only existed on this machine.",
    },
    stepsAfter: ["Commit src/lib/prices.server.ts", "CI passes from a clean install"],
    result: "Pull request #12 is ready for review.",
    file: {
      path: "src/lib/prices.server.ts",
      summary: "+10",
      lines: [
        { number: 1, kind: "added", code: 'import Stripe from "stripe";' },
        { number: 2, kind: "added", code: 'import * as z from "zod/mini";' },
        { number: 3, kind: "added", code: "" },
        {
          number: 4,
          kind: "added",
          code: "const Env = z.object({ STRIPE_SECRET_KEY: z.string() });",
        },
        { number: 5, kind: "added", code: "const { STRIPE_SECRET_KEY } = Env.parse(process.env);" },
        { number: 6, kind: "added", code: "const stripe = new Stripe(STRIPE_SECRET_KEY);" },
        { number: 7, kind: "added", code: "" },
        { number: 8, kind: "added", code: "export function listPrices() {" },
        { number: 9, kind: "added", code: "  return stripe.prices.list({ active: true });" },
        { number: 10, kind: "added", code: "}" },
      ],
    },
    status: "CI passes",
  },
];
