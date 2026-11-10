import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ShimmerText } from "@/components/ui/shimmer-text";
import { useOnScreen } from "@/hooks/use-on-screen";
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

const commandVariants = cva("block font-data whitespace-nowrap text-foreground", {
  variants: {
    size: {
      default: "text-s",
      lg: "",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const copyIconVariants = cva("relative", {
  variants: {
    size: {
      default: "size-5",
      lg: "size-[calc(var(--text-install)*1.1)]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface SnippetProps extends VariantProps<typeof snippetVariants> {
  text: string;
  leading?: ReactNode;
  shimmer?: boolean;
  className?: string;
}

const iconMorph = "transition duration-(--motion-duration) ease-(--motion-easing)";
const iconHidden = "opacity-0 motion-safe:scale-40 motion-safe:blur-xs";

function CommandShimmer({ text, target }: { text: string; target: RefObject<Element | null> }) {
  const onScreen = useOnScreen(target);
  return <ShimmerText text={text} shimmering={onScreen} />;
}

export function Snippet({ text, leading, shimmer = false, size, className }: SnippetProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copied = status === "copied";
  const timeoutRef = useRef<number | null>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const selectCommand = () => {
    const selection = window.getSelection();
    const command = commandRef.current?.querySelector("code");
    if (!selection || !command) return undefined;
    const range = document.createRange();
    range.selectNodeContents(command);
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
      await navigator.clipboard.writeText(text);
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
          <code
            className={cn(
              commandVariants({ size }),
              !leading &&
                "before:mr-xs before:text-muted-foreground before:content-['$'] before:select-none",
            )}
          >
            {shimmer ? <CommandShimmer text={text} target={commandRef} /> : text}
          </code>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => void handleCopy()}
          className="mr-xs"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          <span aria-hidden="true" className={copyIconVariants({ size })}>
            <Icon
              icon={Copy01Icon}
              className={cn("absolute inset-0 size-full", iconMorph, copied && iconHidden)}
            />
            <Icon
              icon={Tick02Icon}
              className={cn("absolute inset-0 size-full", iconMorph, !copied && iconHidden)}
            />
          </span>
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
