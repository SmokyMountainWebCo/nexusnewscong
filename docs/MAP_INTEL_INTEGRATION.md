# Nexus map intel layers — integration notes

Produced by the Grok Bot Scout (`intel_gatherer.py`, every 15 min at :00/:15/:30/:45) on the Grok Bot box.
The files in `public/layers/` are a **snapshot** from 2026-10-16 so the map can be built and tested against real data.

## Files
| Path | Layer | Notes |
|---|---|---|
| `public/layers/conflict_events.geojson` | `conflict_events` | Liveuamap. **Empty right now**: Liveuamap serves a Cloudflare challenge to headless browsers. |
| `public/layers/disaster_events.geojson` | `disaster_events` | GDACS (UN/EC JRC). Up to 13 alerts per run. |

Served by Next.js at `/layers/<layer>.geojson`.

## Schema (one per layer)
```json
{ "type": "FeatureCollection",
  "metadata": { "source": "Grok Bot Intel Pipeline", "last_updated": "ISO-8601", "layer": "conflict_events|disaster_events" },
  "features": [{ "type": "Feature", "geometry": { "type": "Point", "coordinates": [lon, lat] },
    "properties": { "id", "event_type", "severity_score": 1-10, "summary", "source_url", "timestamp", "verified": bool, "bot_note" } }] }
```
- Coordinates use GeoJSON order, `[lon, lat]`. Leaflet's `GeoJSON` component handles that for you; for a plain `Marker`, flip them.
- `verified` is true only when the source is official (GDACS) **and** the summary was checked against the source text. Draw unverified points with a dashed outline.
- Country comes from GDACS's structured `gdacs:country` field (recorded in `bot_note`), not from the LLM.
- Severity comes from the local LLM and is clamped to the GDACS alert band (Green 1-4, Orange 5-7, Red 8-10).
- Files are rewritten atomically each run, so a reader never sees a half-written file.

## Wiring it into `app/page.tsx` (not done in this PR, to avoid touching the room UI)
```tsx
const IntelLayers = dynamic(() => import('../components/IntelLayers'), { ssr: false });
// inside <MapContainer ...> after <TileLayer .../>:
<IntelLayers />
```
Make sure `import 'leaflet/dist/leaflet.css'` is loaded once (e.g. in the root layout).

## Publish path: Git static files
The box commits refreshed layers to `public/layers/` and finished stories to `public/stories/`. The commit triggers a Netlify rebuild. The Supabase options below are optional alternatives.

## Story format (`public/stories/<slug>.md`)
Markdown with YAML-style front-matter, one file per approved story:
```markdown
---
title: "Headline"
location: "Country, Region"
severity: 4
source_urls: ["https://www.gdacs.org/report.aspx?eventid=..."]
timestamp: "2026-10-16T16:00:00Z"
brief_id: "20261016-1559_flood-libya"
---

# Headline
Dateline. Body in AP style, 300-500 words...
```
`source_urls` is a JSON array and `timestamp` is ISO-8601 UTC. Only compliance-approved stories land here. Render them with any Markdown parser (e.g. `gray-matter` + `remark`).

## Keeping data fresh (alternatives)
1. **Commit sync** (current choice, see above).
2. **Supabase Storage / table** (recommended): the Scout uploads to a public bucket, and the frontend fetches that URL instead of `/layers/...`. This needs `SUPABASE_URL`/`SUPABASE_KEY` on the box. **They are not set yet.**
3. **Netlify Blobs or a function** that the box POSTs to.

## Known gaps
- No conflict data until Liveuamap access is solved (official API key, or another OSINT/ACLED feed).
- `app/app/api/ask-grok/route.ts` is nested under `app/app`. Check that this is intended for the App Router.
