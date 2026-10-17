// why: LazyMotion loads this module with import(), so the animation features get their own chunk.
// A static import would pull them back into the page chunk.
export { domAnimation } from "motion/react";
