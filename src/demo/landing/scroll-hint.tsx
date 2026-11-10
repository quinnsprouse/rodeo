import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/icon";
import { pyramidSectionId } from "@/demo/landing/pyramid-section";
import { useScrolledPast } from "@/demo/landing/use-scrolled-past";
import { cn } from "@/lib/utils";

export function ScrollHint() {
  const scrolled = useScrolledPast(24);

  return (
    <a
      href={`#${pyramidSectionId}`}
      aria-label="Scroll to how Rodeo works"
      data-markdown="skip"
      className={cn(
        "mx-auto mb-m flex flex-col items-center gap-xxs px-m py-xs text-s text-muted-foreground transition duration-(--motion-duration) ease-(--motion-easing) hover:text-foreground",
        scrolled && "invisible opacity-0",
      )}
    >
      Scroll
      <Icon
        icon={ArrowDown01Icon}
        className={cn("size-4", !scrolled && "motion-safe:animate-nudge")}
        aria-hidden="true"
      />
    </a>
  );
}
