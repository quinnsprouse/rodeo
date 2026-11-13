import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const sweep = "duration-300 ease-(--motion-large-easing)";

export function Highlight({
  lit,
  delay,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { lit: boolean; delay?: string }) {
  return (
    <span
      {...props}
      className={cn(
        "relative isolate transition-colors",
        sweep,
        delay,
        lit && "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-x-0.5 inset-y-0 -z-10 origin-left rounded-xs bg-primary-transparent transition-transform",
          sweep,
          delay,
          !lit && "scale-x-0",
        )}
      />
      {children}
    </span>
  );
}
