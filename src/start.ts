import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Without this file, Start adds CSRF protection to server functions on its own. Once the file
// exists, only the middleware listed here runs, so keep this one when you add more.
const csrfMiddleware = createCsrfMiddleware({
  // Page requests arrive cross-site from links and search results, so only check server functions.
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}));
