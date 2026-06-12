import { Link } from "@tanstack/react-router";

export function RouteNotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold text-balance">Page not found</h1>
        <p className="text-pretty text-muted-foreground">
          The page you are looking for either moved or does not exist.
        </p>
      </div>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
