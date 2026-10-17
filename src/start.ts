import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// why: TanStack Start adds CSRF protection only while this file doesn't exist. Once it does, only
// the middleware listed here runs, so keep this one.
const csrfMiddleware = createCsrfMiddleware({
  // why: Browsers send page requests cross-site from links and search results, so only server
  // functions are checked.
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
