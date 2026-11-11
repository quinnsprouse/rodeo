import { useRef } from "react";

import {
  snippetBar,
  snippetCode,
  snippetCommand,
  SnippetCopyButton,
  SnippetRoot,
} from "@/components/ui/snippet-parts";
import { site } from "@/config/site";
import { ShimmerText } from "@/demo/landing/shimmer-text";
import { useOnScreen } from "@/demo/landing/use-on-screen";
import { TerminalSticker } from "@/demo/stickers/hero";
import { useCopyCommand } from "@/hooks/use-copy-command";
import { cn } from "@/lib/utils";

export function InstallCommand() {
  const { status, codeRef, copy } = useCopyCommand(site.installCommand);
  const commandRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(commandRef);

  return (
    <SnippetRoot status={status} className="mt-xl max-w-full sm:mt-xxl">
      <div className={cn(snippetBar, "gap-xs rounded-l bg-muted pl-s text-install")}>
        <TerminalSticker className="size-[2em]" />
        <div ref={commandRef} className={cn(snippetCommand, "pr-m")}>
          <code ref={codeRef} className={snippetCode}>
            <ShimmerText text={site.installCommand} shimmering={onScreen} />
          </code>
        </div>
        <SnippetCopyButton
          status={status}
          onCopy={copy}
          iconClassName="size-[calc(var(--text-install)*1.1)]"
        />
      </div>
    </SnippetRoot>
  );
}
