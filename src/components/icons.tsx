import {
  AiBookIcon,
  ArrowRight01Icon,
  Bug01Icon,
  CancelCircleIcon,
  Copy01Icon,
  Github01Icon,
  MagicWand01Icon,
  Shield01Icon,
  Target01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";

interface IconProps extends Omit<HugeiconsIconProps, "icon"> {
  icon: IconSvgElement;
  className?: string;
}

export function Icon({ icon, className, size = 16, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

export {
  AiBookIcon,
  ArrowRight01Icon,
  Bug01Icon,
  CancelCircleIcon,
  Copy01Icon,
  Github01Icon,
  MagicWand01Icon,
  Shield01Icon,
  Target01Icon,
  Tick02Icon,
};
