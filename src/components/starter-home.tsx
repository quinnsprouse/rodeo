import { ThemeToggle } from "@/components/theme-toggle";
import { Snippet } from "@/components/ui/snippet";
import { fonts, preloadFont } from "@/config/fonts";
import type { Page } from "@/config/pages";
import { site } from "@/config/site";
import { website } from "@/lib/structured-data";

export const starterPage: Page = {
  structuredData: (page) => ({ "@context": "https://schema.org", ...website(page) }),
};

export function starterHead() {
  return { links: [preloadFont(fonts.bold), preloadFont(fonts.mono)] };
}

export function StarterHome() {
  return (
    <>
      <header className="absolute inset-x-0 top-0 flex justify-end px-l pt-s sm:px-xl sm:pt-l">
        <ThemeToggle />
      </header>
      <main
        id="main"
        className="flex min-h-svh flex-col items-center justify-center gap-l px-m text-center"
      >
        <div className="space-y-xs">
          <h1 className="font-brand text-xl font-heavy text-balance">{site.name}</h1>
          <p className="text-muted-foreground">{site.tagline}</p>
        </div>
        <Snippet text="npm run dev" />
      </main>
    </>
  );
}
