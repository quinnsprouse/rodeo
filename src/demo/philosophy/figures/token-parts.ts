export const task = {
  part: "task",
  label: "the actual task",
  swatch: "bg-primary",
  grow: "grow-[96]",
} as const;

export const overhead = [
  {
    part: "comments",
    label: "reading comments",
    swatch: "bg-muted-foreground",
    grow: "grow-[84]",
    coins: 4,
  },
  {
    part: "tests",
    label: "fixing unit tests",
    swatch: "bg-neutral-6",
    grow: "grow-[110]",
    coins: 6,
  },
  { part: "docs", label: "reading docs", swatch: "bg-neutral-4", grow: "grow-[76]", coins: 4 },
] as const;

export const rodeoOverhead = { ...overhead[2], grow: "grow-[14]" } as const;
