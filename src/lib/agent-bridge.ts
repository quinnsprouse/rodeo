import { createAgent, registerTools } from "@ui-sdk/react/agent";

export function connectAgentBridge() {
  const agent = createAgent();
  registerTools(agent, { allow: (step) => !step.confirm });
}
