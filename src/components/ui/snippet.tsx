import { useEffect, useRef, useState } from "react";

import { Icon, Tick02Icon, Copy01Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SnippetProps {
  text: string | string[];
  prompt?: boolean;
  /** Sweep a highlight through the command text to draw the eye */
  shimmer?: boolean;
  className?: string;
  onCopy?: () => void;
}

export function Snippet({ text, prompt = true, shimmer = false, className, onCopy }: SnippetProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copied = status === "copied";
  const timeoutRef = useRef<number | null>(null);
  const lines = Array.isArray(text) ? text : [text];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const payload = lines.join("\n");
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus("idle");
    if (!navigator.clipboard?.writeText) {
      setStatus("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      setStatus("failed");
      return;
    }

    setStatus("copied");
    timeoutRef.current = window.setTimeout(() => setStatus("idle"), 1500);
    onCopy?.();
  };

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg border border-border bg-muted/50 dark:bg-muted/30",
        className,
      )}
    >
      <div className="flex-1 overflow-x-auto px-4 py-3">
        {lines.map((line) => (
          <code
            key={line}
            className={cn(
              "block font-mono text-sm whitespace-nowrap text-foreground/90",
              prompt &&
                "before:mr-2.5 before:text-muted-foreground/50 before:content-['$'] before:select-none",
            )}
          >
            {shimmer ? (
              <span className="shimmer-text" data-text={line}>
                {line}
              </span>
            ) : (
              line
            )}
          </code>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="relative flex-none rounded-md p-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        <Icon
          icon={copied ? Tick02Icon : Copy01Icon}
          className={cn("size-5", copied && "text-success")}
          aria-hidden="true"
        />
      </button>
      <output
        className={
          status === "failed" ? "absolute top-full left-0 mt-1 text-xs text-destructive" : "sr-only"
        }
      >
        {status === "failed"
          ? "Couldn't copy. Select and copy the command manually."
          : copied
            ? "Copied to clipboard."
            : ""}
      </output>
    </div>
  );
}
