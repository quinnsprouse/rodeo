import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import type { CopyStatus } from "@/hooks/use-copy-command";
import { cn } from "@/lib/utils";

export const snippetBar = "group relative flex items-center";
export const snippetCommand = "min-w-0 flex-1 overflow-hidden py-s max-xs:mask-r-from-75%";
export const snippetCode = "block font-data whitespace-nowrap text-foreground";

const iconMorph = "transition duration-(--motion-duration) ease-(--motion-easing)";
const iconHidden = "opacity-0 motion-safe:scale-40 motion-safe:blur-xs";

export function SnippetRoot({
  status,
  className,
  children,
}: {
  status: CopyStatus;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {children}
      <output className={status === "failed" ? "mt-xs text-xs text-foreground" : "sr-only"}>
        {status === "failed"
          ? "Couldn't copy. Select and copy the command manually."
          : status === "copied"
            ? "Copied to clipboard."
            : ""}
      </output>
    </div>
  );
}

export function SnippetCopyButton({
  status,
  onCopy,
  iconClassName,
}: {
  status: CopyStatus;
  onCopy: () => Promise<void>;
  iconClassName: string;
}) {
  const copied = status === "copied";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => void onCopy()}
      className="mr-xs"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      <span aria-hidden="true" className={cn("relative", iconClassName)}>
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
  );
}
