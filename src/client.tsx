import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

async function connectBrowserAgent() {
  if (!("modelContext" in document)) return;
  const { connectAgentBridge } = await import("@/lib/agent-bridge");
  connectAgentBridge();
}

void connectBrowserAgent();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
