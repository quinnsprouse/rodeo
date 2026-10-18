import { ChecksDemo } from "@/components/checks-demo";

export function ChecksSection() {
  return (
    <section className="px-l py-xxl sm:px-xl">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-brand text-l font-heavy text-balance text-foreground">
          Mistakes go back to the agent, not to you.
        </h2>
        <p className="mx-auto mt-s max-w-[480px] text-muted-foreground">
          Rodeo checks the agent's work as it goes. When a check fails, the agent gets the error and
          fixes it before you look.
        </p>
      </div>
      <ChecksDemo className="mx-auto mt-xl max-w-4xl" />
    </section>
  );
}
