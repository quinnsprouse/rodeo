import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Copy01Icon,
  Github01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";

interface IconProps extends Omit<HugeiconsIconProps, "icon" | "strokeWidth"> {
  icon: IconSvgElement;
  className?: string;
}

export function Icon({ icon, className, size = 16, ...props }: IconProps) {
  return (
    <HugeiconsIcon icon={icon} size={size} className={className} data-slot="icon" {...props} />
  );
}

export {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Copy01Icon,
  Github01Icon,
  Tick02Icon,
};
