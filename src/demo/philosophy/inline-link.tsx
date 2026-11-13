import type { ReactNode } from "react";

import { ExternalLink } from "@/demo/external-link";

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <ExternalLink
      href={href}
      className="text-foreground underline decoration-neutral-4 underline-offset-4 transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:decoration-foreground"
    >
      {children}
    </ExternalLink>
  );
}
