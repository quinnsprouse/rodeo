import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { useRef, useState } from "react";

import { Icon, Tick02Icon, Copy01Icon } from "@/components/icons";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { cn } from "@/lib/utils";

interface SnippetProps {
  text: string | string[];
  prompt?: boolean;
  className?: string;
  onCopy?: () => void;
}

export function Snippet({ text, prompt = true, className, onCopy }: SnippetProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const lines = Array.isArray(text) ? text : [text];

  useMountEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  });

  const handleCopy = async () => {
    const payload = lines.join("\n");
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      onCopy?.();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silently fail
    }
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
              "block font-mono text-[13px] whitespace-nowrap text-foreground/90",
              prompt &&
                "before:mr-2.5 before:text-muted-foreground/50 before:content-['$'] before:select-none",
            )}
          >
            {line}
          </code>
        ))}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="relative flex-none rounded-md p-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#863bff]/50 focus-visible:outline-none"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        <div className="relative flex size-5 items-center justify-center">
          <LazyMotion features={domAnimation}>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={copied ? "check" : "copy"}
                initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-full",
                  copied && "bg-emerald-500/15",
                )}
              >
                <Icon
                  icon={copied ? Tick02Icon : Copy01Icon}
                  className={cn(
                    "size-4",
                    copied && "size-3 text-emerald-600 dark:text-emerald-400",
                  )}
                  strokeWidth={copied ? 2.5 : 1.5}
                  aria-hidden="true"
                />
              </m.span>
            </AnimatePresence>
          </LazyMotion>
        </div>
      </button>
    </div>
  );
}
