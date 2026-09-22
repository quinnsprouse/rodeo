import { Link, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button, buttonVariants } from "@/components/ui/button";

const productionMessage = "The application hit an unexpected error. You can retry or return home.";

export function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  const message = import.meta.env.DEV && error instanceof Error ? error.message : productionMessage;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Error</p>
        <h1 className="text-3xl font-semibold text-balance">Something went wrong</h1>
        <p className="text-pretty text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {/* Invalidating reruns the loaders before the error boundary resets. */}
        <Button type="button" size="lg" onClick={() => void router.invalidate()}>
          Try again
        </Button>
        {/* A link styled with buttonVariants looks like a button and keeps the link role. */}
        <Link to="/" search={{}} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back home
        </Link>
      </div>
    </div>
  );
}
