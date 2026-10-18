import { Icon, Tick02Icon } from "@/components/icons";
import { BullSticker } from "@/components/stickers/hero";
import { cn } from "@/lib/utils";

export const reveal = "transition duration-(--motion-large-duration) ease-(--motion-large-easing)";
export const concealed = "translate-y-1.5 scale-97 opacity-0 blur-xs";
export const iconSwap = "transition duration-(--motion-duration) ease-(--motion-easing)";
export const iconOut = "scale-40 opacity-0 blur-xs";

export function StatusPill({
  status,
  shown,
  className,
}: {
  status: string;
  shown: boolean;
  className?: string;
}) {
  return (
    <p
      data-markdown="skip"
      className={cn(
        "dark flex w-fit items-center gap-s rounded-full bg-card py-xxs pr-m pl-xs text-s text-card-foreground ring ring-border",
        reveal,
        !shown && "translate-y-2 scale-95 opacity-0 blur-xs",
        className,
      )}
    >
      <BullSticker className={cn("size-8 delay-100", reveal, !shown && "scale-75 -rotate-12")} />
      <span className="font-medium">Rodeo</span>
      <span className="flex items-center gap-xxs text-muted-foreground">
        <Icon
          icon={Tick02Icon}
          className={cn("size-4 text-success delay-300", iconSwap, !shown && iconOut)}
          aria-hidden="true"
        />
        {status}
      </span>
    </p>
  );
}
