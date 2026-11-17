# Vendored Motion Blitz modules

Small snapshots of our own Motion Blitz code (MIT), used by the Nexus desk
so Phase 1 motion does not reinvent easings, springs, camera rigs, or grade tokens.

Source (local checkout on 17 Nov 2026):

- `packages/motion/springs.js` → `springs.js` (easings, spring solver, presets)
- `packages/core/env.js` → `env.js` (reduced motion, DPR cap, WebGL checks)
- `packages/camera/camera.js` → `camera.js` (cinematic rigs, including `orbit`)
- `packages/looks/looks.js` `LOOKS` and `packages/looks/lut.js` `GRADES` → `looks-tokens.js`

Do not edit these to invent new curves. When Motion Blitz changes a preset,
copy the updated module forward.

The site theme (dark slate tokens in `app/globals.css`) is owned by Nexus Site
Experience. Look tokens are used only inside the WebGL constellation, not to
recolor the page.
