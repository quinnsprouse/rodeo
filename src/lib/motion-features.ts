// LazyMotion loads this module with import(), so the bundler puts the animation features in their
// own chunk and `m` components render before it arrives. A static import would pull the features
// back into the page chunk.
export { domAnimation } from "motion/react";
