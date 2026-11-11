import { useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

export function useCopyCommand(text: string) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<number | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const selectCommand = () => {
    const selection = window.getSelection();
    const code = codeRef.current;
    if (!selection || !code) return undefined;
    const range = document.createRange();
    range.selectNodeContents(code);
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

  const copy = async () => {
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

  return { status, codeRef, copy };
}
