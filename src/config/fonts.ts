import geistMono from "@/assets/fonts/geist-mono-core.woff2?url";
import openRundeRegular from "@/assets/fonts/open-runde-400-core.woff2?url";
import openRundeMedium from "@/assets/fonts/open-runde-500-core.woff2?url";
import openRundeBold from "@/assets/fonts/open-runde-700-core.woff2?url";

export const fonts = {
  regular: openRundeRegular,
  medium: openRundeMedium,
  bold: openRundeBold,
  mono: geistMono,
};

export function preloadFont(href: string) {
  return {
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  } as const;
}
