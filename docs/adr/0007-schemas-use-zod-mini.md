# Schemas use Zod Mini

Route `validateSearch` schemas and `src/config/env.ts` run in the browser, and the router keeps them in the entry chunk that every route downloads. For one enum and one URL, classic Zod added 20 KB gzipped to that chunk, and Zod Mini adds 6 KB. Every schema imports `zod/mini` and lint rejects `zod`, so agents learn one API, even for server-only schemas where classic Zod would cost nothing.
