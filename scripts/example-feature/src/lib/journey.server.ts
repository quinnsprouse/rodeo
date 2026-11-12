import { createHmac } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import * as z from "zod/mini";

const journeyEnv = z.object({ JOURNEY_SECRET: z.string().check(z.minLength(16)) });
const slowUpstream = 800;

export async function signForVisitor(visitor: string) {
  const { JOURNEY_SECRET } = journeyEnv.parse(process.env);
  await delay(slowUpstream);
  const signature = createHmac("sha256", JOURNEY_SECRET).update(visitor).digest("hex");
  return { visitor, signature: signature.slice(0, 12) };
}
