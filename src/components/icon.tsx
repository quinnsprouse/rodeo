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
