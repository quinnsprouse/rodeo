import { cn } from "@/lib/utils";

export function ShimmerText({
  text,
  shimmering = true,
  className,
}: {
  text: string;
  shimmering?: boolean;
  className?: string | undefined;
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      {text}
      {shimmering && <span aria-hidden="true" data-text={text} className="shimmer-window" />}
    </span>
  );
}
