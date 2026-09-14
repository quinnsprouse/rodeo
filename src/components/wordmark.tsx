import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Penflow's font parser reads window at import time, so load it only inside ClientOnly.
const Penflow = lazy(() =>
  import("penflow/react").then(
    (module) => ({ default: module.Penflow }),
    () => ({ default: StaticWordmark }),
  ),
);

function StaticWordmark() {
  return <div className="pt-3 pl-12 font-script text-9xl leading-none text-brand">Rodeo</div>;
}

export function Wordmark({ animate }: { animate: boolean }) {
  return (
    <div className="-ml-12 h-[172px]">
      <ClientOnly>
        <Suspense fallback={null}>
          <Penflow
            text="Rodeo"
            fontUrl="/fonts/Yellowtail-Regular.ttf"
            color="#863bff"
            size={128}
            brushScale={0.12}
            quality="calm"
            seed="rodeo"
            animate={animate}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
