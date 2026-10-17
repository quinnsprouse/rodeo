import { Link } from "@tanstack/react-router";

import { BullSticker } from "@/components/stickers/hero";
import { buttonVariants } from "@/components/ui/button";

export function RouteNotFoundComponent() {
  return (
    <main
      id="main"
      className="flex min-h-svh flex-col items-center justify-center gap-l px-m text-center"
    >
      <BullSticker className="size-28 -rotate-12" />
      <div className="space-y-xs">
        <p className="text-s font-medium text-muted-foreground">404</p>
        <h1 className="font-brand text-xl font-heavy text-balance">Page not found</h1>
        <p className="text-muted-foreground">
          This page got bucked off. It moved, or it never existed.
        </p>
      </div>
      <Link to="/" search={{}} className={buttonVariants()}>
        Back home
      </Link>
    </main>
  );
}
