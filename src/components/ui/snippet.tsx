import {
  snippetBar,
  snippetCode,
  snippetCommand,
  SnippetCopyButton,
  SnippetRoot,
} from "@/components/ui/snippet-parts";
import { useCopyCommand } from "@/hooks/use-copy-command";
import { cn } from "@/lib/utils";

export function Snippet({ text, className }: { text: string; className?: string }) {
  const { status, codeRef, copy } = useCopyCommand(text);

  return (
    <SnippetRoot status={status} className={className}>
      <div className={cn(snippetBar, "rounded-m bg-card ring ring-border")}>
        <div className={cn(snippetCommand, "px-m")}>
          <code
            ref={codeRef}
            className={cn(
              snippetCode,
              "text-s before:mr-xs before:text-muted-foreground before:content-['$'] before:select-none",
            )}
          >
            {text}
          </code>
        </div>
        <SnippetCopyButton status={status} onCopy={copy} iconClassName="size-5" />
      </div>
    </SnippetRoot>
  );
}
