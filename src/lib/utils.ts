import { createCn } from "cn/config";

const sizes = ["xxs", "xs", "s", "m", "l", "xl", "xxl"];

export const cn = createCn({
  extend: {
    theme: {
      text: [...sizes, "wordmark"],
      spacing: ["zero", ...sizes],
      font: ["ui", "brand", "editorial", "data", "script"],
      "font-weight": ["regular", "medium", "heavy"],
      radius: ["zero", "xs", "s", "m", "l", "xl", "full"],
      shadow: ["s", "m", "l"],
      tracking: ["xs", "s", "m", "l", "xl"],
    },
  },
});
