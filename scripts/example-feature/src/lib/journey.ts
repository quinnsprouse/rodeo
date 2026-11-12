import { createServerFn } from "@tanstack/react-start";
import * as z from "zod/mini";

import { signForVisitor } from "@/lib/journey.server";

export const signVisit = createServerFn({ method: "POST" })
  .validator(z.object({ visitor: z.string().check(z.minLength(1), z.maxLength(40)) }))
  .handler(({ data }) => signForVisitor(data.visitor));

export type SignedVisit = Awaited<ReturnType<typeof signVisit>>;
