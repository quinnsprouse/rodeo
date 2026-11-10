import type { CSSProperties } from "react";

declare module "react" {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number;
  }
}
