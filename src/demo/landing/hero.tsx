import { BullSticker } from "@/components/stickers/bull";
import { site } from "@/config/site";
import { InstallCommand } from "@/demo/landing/install-command";
import { SwapSentence } from "@/demo/landing/swap-sentence";

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

      <InstallCommand />

      <p aria-hidden="true" className="mt-m text-center text-s text-muted-foreground sm:text-m">
        {site.tagline}
      </p>
    </section>
  );
}
