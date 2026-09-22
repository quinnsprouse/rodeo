# Deploy

Nitro builds the server, so one codebase deploys to Node, Vercel, or Cloudflare Workers. A Nitro preset picks the target at build time. The security headers in `vite.config.ts` apply on every target.

Before a production deploy, set `VITE_APP_URL` to the public origin. `src/config/env.ts` validates it at startup, and the canonical and social tags use it.

## Deploy to a Node server

1. Build the app:

   ```bash
   npm run build
   ```

2. Start the server. It listens on `PORT` (default `3000`) and `HOST`:

   ```bash
   PORT=8080 npm run start
   ```

## Deploy to Vercel

Import the repository in Vercel. Nitro detects Vercel during the build and selects its preset, so the project needs no configuration. Add `VITE_APP_URL` under **Environment Variables**.

## Deploy to Cloudflare Workers

1. Build with the Workers preset:

   ```bash
   NITRO_PRESET=cloudflare_module npm run build
   ```

   The build writes `.output/server/wrangler.json` and a `.output/public/_headers` file that applies the security headers to static assets.

2. To test the Worker locally in Cloudflare's runtime, run:

   ```bash
   npx wrangler dev
   ```

3. Log in and deploy:

   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

To deploy on every push instead, connect the repository with Cloudflare Workers Builds. Set the build command to `NITRO_PRESET=cloudflare_module npm run build` and the deploy command to `npx wrangler deploy`.

Server code on Workers runs in `workerd` with Node.js compatibility turned on, not in Node itself. The runtime has no writable file system, and some Node APIs are missing. If server code uses a Node API, run `npx wrangler dev` against a Workers build before you deploy.
