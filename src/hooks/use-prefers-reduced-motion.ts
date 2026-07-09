import { useState } from "react";

import { useMountEffect } from "./use-mount-effect";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useMountEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });

  return reduced;
}
