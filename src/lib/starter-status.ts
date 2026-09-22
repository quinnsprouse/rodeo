import { z } from "zod";

// Server functions receive untrusted input. TanStack Start runs this schema before the handler and
// infers the handler's `data` type from the schema's output.
export const starterStatusInputSchema = z.object({
  fail: z.boolean(),
});

export type StarterStatusInput = z.infer<typeof starterStatusInputSchema>;

export type StarterStatus = {
  state: "ready";
  message: string;
};

export function resolveStarterStatus({ fail }: StarterStatusInput): StarterStatus {
  if (fail) {
    throw new Error("The starter server function failed as requested.");
  }

  return {
    state: "ready",
    message: "Route loader and server function are connected.",
  };
}
