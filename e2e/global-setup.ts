import { appOrigin, baseURL } from "./environment";

async function builtOrigin() {
  const robots = await (await fetch(`${baseURL}/robots.txt`)).text();
  const sitemap = /^Sitemap: (?<url>\S+)$/m.exec(robots)?.groups?.url;
  return sitemap ? new URL(sitemap).origin : "no origin";
}

export default async function checkBuiltOrigin() {
  const origin = await builtOrigin();
  if (origin !== appOrigin) {
    throw new Error(
      `The server under test was built for ${origin}, but .env.e2e sets ${appOrigin}. Rebuild with npm run test:e2e.`,
    );
  }
}
