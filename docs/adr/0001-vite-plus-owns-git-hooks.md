# Vite+ owns Git hooks

Vite+ is the sole adapter at the Git hook seam. It already installs hook dispatchers and owns staged checks, so keeping Husky as a second installer made `core.hooksPath` order-dependent; commitlint, React Doctor, and the Push Profile now run from tracked `.vite-hooks` files instead.
