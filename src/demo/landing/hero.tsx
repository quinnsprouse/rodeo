import { BullSticker } from "@/components/stickers/bull";
import { Snippet } from "@/components/ui/snippet";
import { site } from "@/config/site";
import { SwapSentence } from "@/demo/landing/swap-sentence";
import { TerminalSticker } from "@/demo/stickers/hero";

export function Hero() {
  return (
    <section className="@container flex flex-1 flex-col items-center justify-center px-m py-xl sm:px-xl">
      <h1 className="flex items-center gap-xxs font-brand text-logo font-heavy tracking-xs text-foreground">
        <BullSticker className="size-[1.4em]" />
        rodeo
        <span className="sr-only">: {site.tagline}</span>
      </h1>

      <div className="mt-l w-full sm:mt-xl">
        <SwapSentence />
      </div>

      <Snippet
        text={site.installCommand}
        size="lg"
        leading={<TerminalSticker className="size-[2em]" />}
        shimmer
        className="mt-xl max-w-full sm:mt-xxl"
      />

      <p aria-hidden="true" className="mt-m text-center text-s text-muted-foreground sm:text-m">
        {site.tagline}
      </p>
    </section>
  );
}
