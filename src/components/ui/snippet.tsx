import { useEffect, useRef, useState } from "react";

import { Icon, Tick02Icon, Copy01Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SnippetProps {
  text: string | string[];
  prompt?: boolean;
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
        "group relative flex items-center rounded-m bg-card ring ring-border",
        className,
      )}
    >
      <div className="flex-1 overflow-x-auto px-m py-s">
        {lines.map((line) => (
          <code
            key={line}
            className={cn(
              "block font-data text-s whitespace-nowrap text-foreground",
              prompt &&
                "before:mr-xs before:text-muted-foreground before:content-['$'] before:select-none",
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void handleCopy()}
        className="mr-xs"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        <Icon icon={copied ? Tick02Icon : Copy01Icon} className="size-5" aria-hidden="true" />
      </Button>
      <output
        className={
          status === "failed"
            ? "absolute top-full left-0 mt-xxs text-xs text-foreground"
            : "sr-only"
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
