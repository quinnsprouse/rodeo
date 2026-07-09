export type StarterStatusInput = {
  fail: boolean;
};

export type StarterStatus = {
  state: "ready";
  message: string;
};

export function validateStarterStatusInput(input: StarterStatusInput): StarterStatusInput {
  if (typeof input?.fail !== "boolean") {
    throw new Error("Invalid starter status input.");
  }

  return { fail: input.fail };
}

export function resolveStarterStatus({ fail }: StarterStatusInput): StarterStatus {
  if (fail) {
    throw new Error("The starter server function failed as requested.");
  }

  return {
    state: "ready",
    message: "Route loader and server function are connected.",
  };
}
