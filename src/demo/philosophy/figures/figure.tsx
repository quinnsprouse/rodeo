import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

export function Figure({
  caption,
  waiting = false,
  children,
}: {
  caption: string;
  waiting?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={cn("py-s", waiting && "hold-still")}>
      {children}
      <figcaption className="mt-s text-center text-xs text-pretty text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

export function Card({
  ref,
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement> | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div ref={ref} className={cn("rounded-l bg-background p-l ring ring-border", className)}>
      {children}
    </div>
  );
}
