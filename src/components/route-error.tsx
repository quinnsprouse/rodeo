import { Link, useRouter } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  const message = import.meta.env.DEV
    ? error.message
    : "The application hit an unexpected error. You can retry or return home.";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Error</p>
        <h1 className="text-3xl font-semibold text-balance">Something went wrong</h1>
        <p className="text-pretty text-muted-foreground">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => void router.invalidate()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
        >
          Try again
        </button>
        <Link
          to="/"
          search={{}}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
