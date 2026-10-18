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
      {shimmering && (
        <span aria-hidden="true" className="shimmer-window">
          <span className="shimmer-copy">{text}</span>
        </span>
      )}
    </span>
  );
}
