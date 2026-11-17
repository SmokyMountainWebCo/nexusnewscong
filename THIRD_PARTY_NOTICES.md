# Third-party notices — Nexus News Media

This file lists third-party code used by the Nexus desk beyond the Next.js and React stack.

## Lenis (MIT)

- Package: `lenis` 1.3.27
- License: MIT
- Copyright: Darkroom Engineering / Studio Freight contributors
- Used for smooth scrolling on pointer-fine, non-reduced-motion sessions.

## GSAP (GreenSock Standard License)

- Package: `gsap` 3.15.1, including the ScrollTrigger plugin
- License: GreenSock Standard "no charge" License, https://gsap.com/standard-license
- Used on this live, scroll-driven site for ScrollTrigger integration with Lenis.
- GSAP source is not copied into this repository; the npm package is a dependency.

## three.js (MIT)

- Package: `three` 0.187.0
- License: MIT
- Copyright: three.js authors
- Loaded only as a dynamic import for the home-page story constellation.

## DuckDB-Wasm (MIT)

- Package: `@duckdb/duckdb-wasm` 1.32.0
- License: MIT
- Copyright: DuckDB Foundation and contributors
- Loaded only on demand when a reader runs the story-index query hook.

## Motion Blitz (MIT, first-party)

- Vendored snapshots of our own Motion Blitz modules live in `lib/motion-blitz/`.
- License: MIT (see the Motion Blitz `LICENSE`).
- Modules used: `packages/motion/springs.js`, `packages/core/env.js`, `packages/camera/camera.js`, and the `LOOKS` / `GRADES` tokens from `packages/looks`.
