# Nexus

The desk is a Next.js app. Summary, press, conspiracy, markets, and account stay on their own routes. The war room no longer draws a Leaflet map. It frames [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view).

## God's Eye View

`NEXT_PUBLIC_GEV_URL` is the GEV origin. It defaults to `http://localhost:4173`. The war room and each story page load that origin with `?embed=1`.

GEV has to run separately. It needs Node.js 24.14 or newer, or Node 26. Node 25 is refused by its setup doctor.

```bash
git clone https://github.com/bilawalsidhu/gods-eye-view.git
cd gods-eye-view
npm ci
# Allow this desk to frame embed mode. Use the desk origin, or * for any page.
GEV_EMBED_FRAME_ANCESTORS='*' npm run dev
```

Open `http://localhost:4173`. Embed mode is `http://localhost:4173/?embed=1`. Framing is denied until `GEV_EMBED_FRAME_ANCESTORS` is set. Restart GEV after changing it.

Point the desk at another host by rebuilding with `NEXT_PUBLIC_GEV_URL`:

```bash
NEXT_PUBLIC_GEV_URL=https://globe.example npm run build
```

A hosted globe also needs that host to allow this site in `frame-ancestors`. The Netlify deploy shows "Globe not connected" until `NEXT_PUBLIC_GEV_URL` points at a running GEV and that instance allows the site to frame it.

The parent posts `{ type: 'gev:view', id, view }` only after `{ type: 'gev:ready' }`. It accepts `{ type: 'gev:view-applied', id, ok, steps }` only from the configured origin. The view fields match `createView` in GEV `src/view/index.js`: `camera` (`lat`, `lon`, `altitude_m`, `heading_deg`, `pitch_deg`), `layers` (ids from `REGISTERED_LAYER_IDS`), and `follow` (`kind` of `aircraft`, `military_aircraft`, or `satellite`, plus `id`, and `cockpit` for aircraft).

Opening a story flies the camera to coordinates parsed from its location text, when that text contains a latitude and longitude. Guam and the Cook Islands stories do. The panel lists those stories as camera presets.

## What was removed

`public/layers/conflict_events.geojson` and `public/layers/disaster_events.geojson` are gone. This branch did not render them. Leaflet, react-leaflet, and their type packages are not dependencies. There is no markets map layer and no feed-status notice, because those belonged to the removed files.

## Scripts

```bash
npm install
npm run lint
npm run build
node --experimental-strip-types lib/gev/bridge.test.ts
node --experimental-strip-types lib/stories.test.ts
```
