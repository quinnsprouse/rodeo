import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as z from "zod/mini";

import { ArrowRight01Icon, Icon } from "@/components/icons";
import { PageSection } from "@/components/page-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { resolveStarterStatus, starterStatusInputSchema } from "@/lib/starter-status";
import { cn } from "@/lib/utils";

const demoSearchSchema = z.object({
  demo: z.catch(z.optional(z.enum(["crash", "error"])), undefined),
});

const getStarterStatus = createServerFn({ method: "GET" })
  .validator(starterStatusInputSchema)
  .handler(({ data }) => resolveStarterStatus(data));

async function loadStarterStatus(fail: boolean) {
  try {
    return await getStarterStatus({ data: { fail } });
  } catch (error) {
    return {
      state: "error" as const,
      message: error instanceof Error ? error.message : "The starter server function failed.",
    };
  }
}

export const Route = createFileRoute("/example")({
  validateSearch: demoSearchSchema,
  loaderDeps: ({ search }) => ({ crash: search.demo === "crash", fail: search.demo === "error" }),
  loader: async ({ deps }) => {
    if (deps.crash) return await getStarterStatus({ data: { fail: true } });
    return await loadStarterStatus(deps.fail);
  },
  head: () => ({ meta: [{ title: "Full-stack example — Rodeo" }] }),
  component: Example,
});

function Example() {
  const starterStatus = Route.useLoaderData();
  const failed = starterStatus.state === "error";

  return (
    <main id="main">
      <PageSection>
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-s text-muted-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground"
          >
            Home
          </Link>
          <ThemeToggle className="-my-2.5 -mr-2.5" />
        </div>
        <h1 className="mt-xl font-brand text-l font-heavy text-foreground">Full-stack example</h1>
        <p className="mt-s max-w-[480px] text-muted-foreground">
          This page loads data through a server function in its route loader and turns a failure
          into a typed result. Copy its shape for your own routes.
        </p>

        <div
          className="mt-xl grid gap-l rounded-l bg-card p-l ring ring-border sm:grid-cols-[1fr_auto] sm:items-center"
          role={failed ? "alert" : "status"}
        >
          <div>
            <div className="flex items-center gap-xs">
              <span
                className={cn("size-2 rounded-full", failed ? "bg-warning" : "bg-success")}
                aria-hidden="true"
              />
              <h2 className="text-s font-medium text-foreground">
                {failed ? "Handled server error" : "Live full-stack example"}
              </h2>
            </div>
            <p className="mt-xs text-s text-muted-foreground">{starterStatus.message}</p>
            <p className="mt-xs font-data text-xs text-muted-foreground">
              route loader → server function → rendered result
            </p>
          </div>
          <Link
            to="/example"
            search={failed ? {} : { demo: "error" }}
            className="group inline-flex items-center gap-xs text-s font-medium text-foreground transition-colors duration-(--motion-duration) ease-(--motion-easing) hover:text-primary"
          >
            {failed ? "Return to ready state" : "Preview the error path"}
            <Icon
              icon={ArrowRight01Icon}
              className="size-3 transition-transform duration-(--motion-duration) ease-(--motion-easing) group-hover:translate-x-xxs"
              aria-hidden="true"
            />
          </Link>
        </div>
      </PageSection>
    </main>
  );
}
