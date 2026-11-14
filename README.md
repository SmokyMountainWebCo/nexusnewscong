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

## Static desk

`npm run build` writes a static export to `out/`. There is no API route. Ask Nexus searches `public/stories/search.json`, `public/kb/claims.json`, and the optional `public/stories/sources.json` and `public/stories/briefs.json` in the browser. A missing optional file is an empty section.

Fact-check stories use `event_type` `fact-check` or a matching tag. `verdict_type` `debunk` is a red Debunked label, `confirmation` is a green Confirmed label, `mixed` is an amber Mixed label and border (`#ffc56d`), and a missing value is a neutral Fact-check label. `rating` is shown as written.

Market stories use `event_type` `market` or `market movers`. `quotes` is a table of `{name, last, prev_close, change_pct, as_of, url}`. `quotes_note` prints under the table. A story-level `as_of` of `YYYY-MM-DD` prints as a date, with no clock and no timezone shift. Quotes without coordinates still list. There is no markets map.

Routes: `/`, `/summary`, `/war-room`, `/press`, `/press/<slug>/`, `/conspiracy`, `/markets`, `/market-movers`, `/account`.

## Investigation stories

`confidence` and `canaries` are optional on markdown front-matter, `public/stories/index.json`, and `public/stories/search.json`. `confidence` may be `Low`, `Medium`, or `High`, or a list paired with `conclusions`. Each canary is a string or an object with an indicator, a date or window, and a source url or label. When those fields are missing and the body has none of the five section headings, the story uses the normal layout.

The five headings, when present, are Surface narrative, Primary evidence, Who benefits, What coverage is leaving out, and Bottom line / conclusions. Conclusions show a neutral Low badge, an amber Medium badge (`#ffc56d`), or a green High badge. Canaries render as What to watch (30–90 days). A blockquote, or a line that starts with `Inference:`, is marked as inference.

The sample story used by the tests is `lib/fixtures/investigation-story.md`. It is not published under `public/stories`.

## What was not carried from the map desk

Leaflet, react-leaflet, and `public/layers` GeoJSON are not in this desk. Conflict and disaster feed-status notices and the markets map were part of that map and were not brought back. The Ask Nexus agent loop and the Supabase route are gone; search reads the published files.

## Scripts

```bash
npm install
npm test
npm run lint
npm run build
```
