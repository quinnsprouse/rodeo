import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Icon, Tick02Icon, Copy01Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const snippetVariants = cva("group relative flex items-center", {
  variants: {
    size: {
      default: "rounded-m bg-card ring ring-border",
      lg: "gap-xs rounded-l bg-muted pl-s text-install",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface SnippetProps extends VariantProps<typeof snippetVariants> {
  text: string | string[];
  prompt?: boolean;
  leading?: ReactNode;
  shimmer?: boolean;
  className?: string;
  onCopy?: () => void;
}

export function Snippet({
  text,
  prompt = true,
  leading,
  shimmer = false,
  size,
  className,
  onCopy,
}: SnippetProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copied = status === "copied";
  const timeoutRef = useRef<number | null>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const lines = Array.isArray(text) ? text : [text];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const selectCommand = () => {
    const selection = window.getSelection();
    const commands = commandRef.current?.querySelectorAll("code");
    const first = commands?.item(0);
    const last = commands?.item(commands.length - 1);
    if (!selection || !first || !last) return undefined;
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(last, last.childNodes.length);
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  };

  const copySelectedCommand = () => {
    const selection = selectCommand();
    if (!selection || !document.execCommand("copy")) return false;
    selection.removeAllRanges();
    return true;
  };

  const showCopied = () => {
    setStatus("copied");
    timeoutRef.current = window.setTimeout(() => setStatus("idle"), 1500);
    onCopy?.();
  };

  const copyWithFallback = () => {
    if (copySelectedCommand()) {
      showCopied();
      return;
    }
    selectCommand();
    setStatus("failed");
  };

  const handleCopy = async () => {
    const payload = lines.join("\n");
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus("idle");
    if (!navigator.clipboard?.writeText) {
      copyWithFallback();
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      copyWithFallback();
      return;
    }

    showCopied();
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={snippetVariants({ size })}>
        {leading}
        <div
          ref={commandRef}
          className={cn(
            "min-w-0 flex-1 overflow-hidden py-s max-xs:mask-r-from-75%",
            leading ? "pr-m" : "px-m",
          )}
        >
          {lines.map((line) => (
            <code
              key={line}
              className={cn(
                "block font-data whitespace-nowrap text-foreground",
                size !== "lg" && "text-s",
                prompt &&
                  !leading &&
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
          <Icon
            icon={copied ? Tick02Icon : Copy01Icon}
            className={size === "lg" ? "size-[calc(var(--text-install)*1.1)]" : "size-5"}
            aria-hidden="true"
          />
        </Button>
      </div>
      <output className={status === "failed" ? "mt-xs text-xs text-foreground" : "sr-only"}>
        {status === "failed"
          ? "Couldn't copy. Select and copy the command manually."
          : copied
            ? "Copied to clipboard."
            : ""}
      </output>
    </div>
  );
}
