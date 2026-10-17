import type { ReactNode } from "react";

export function PageSection({ id, children }: { id?: string | undefined; children: ReactNode }) {
  return (
    <section id={id} className="px-l py-xxl sm:px-xl">
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </section>
  );
}
