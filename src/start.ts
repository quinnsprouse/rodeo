import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

// why: TanStack Start adds CSRF protection only while this file doesn't exist. Once it does, only
// the middleware listed here runs, so keep this one.
const csrfMiddleware = createCsrfMiddleware({
  // why: Browsers send page requests cross-site from links and search results, so only server
  // functions are checked.
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// why: TanStack Start throws a plain Error for an unknown server function ID, and its h3 layer
// logs that as an unhandled 500. e2e/security.spec.ts fails if this text changes.
const unknownServerFnMessage = "Server function info not found for ";

function isUnknownServerFn(error: unknown) {
  return error instanceof Error && error.message.startsWith(unknownServerFnMessage);
}

const unknownServerFnMiddleware = createMiddleware().server(async ({ handlerType, next }) => {
  if (handlerType !== "serverFn") return next();
  try {
    return await next();
  } catch (error) {
    if (isUnknownServerFn(error)) return new Response("Not Found", { status: 404 });
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, unknownServerFnMiddleware],
}));
