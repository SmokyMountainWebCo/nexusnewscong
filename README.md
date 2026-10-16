# Nexus News Media

The product frontend is a Next.js App Router desk in `app/`. It is not the static Smoky Mountain site in `smoky-mountain-site/`, and it does not read stories or map layers from Supabase.

`lib/supabaseClient.ts` is unused by the desk. Published content is static files under `public/`.

## What the publisher commits

No application change is required to publish a story or refresh a layer. Edit the files below and deploy. This app copies `public/` when it builds, so the content commit has to be deployed before the desk can see it. Open tabs refetch map layers every five minutes; stories load when the page loads.

### Stories

The desk lists stories from `public/stories/index.json` (served at `/stories/index.json`), then fetches each story’s markdown. The publisher keeps the index up to date. Dropping a markdown file without adding it to the index will not list it.

```json
{
  "generated_at": "2026-10-16T16:07:44Z",
  "stories": [
    {
      "slug": "botswana-mozambique-forest-fires-oct-2026",
      "title": "Satellite monitors flag low-impact forest fires in Botswana and Mozambique",
      "date": "2026-10-16",
      "event_type": "forest_fire",
      "alert_level": "GDACS Green (lowest)",
      "summary": "One-paragraph deck used on the card.",
      "path": "/stories/botswana-mozambique-forest-fires-oct-2026.md"
    }
  ]
}
```

| Field | Required | Use |
|---|---|---|
| `generated_at` | no | Shown as the index time. ISO-8601. |
| `stories[].slug` | yes | Identity. Also the default filename. |
| `stories[].title` | yes | Card and article title if the file has none. |
| `stories[].date` | no | Card date, `YYYY-MM-DD` or ISO-8601. |
| `stories[].event_type` | no | Shown as a label. Underscores are spaced. |
| `stories[].alert_level` | no | Badge text. The words Green, Orange, or Red set the color. |
| `stories[].alert_note` | no | Short reason for the alert level. Caption beside the article badge. Front matter wins if both are set. |
| `stories[].summary` | no | Card deck. |
| `stories[].updated` | no | ISO-8601 UTC. Press Room cards show an Updated label with that time. |
| `stories[].update_note` | no | Short correction text. Shown in the article notice. Front matter wins if both are set. |
| `stories[].path` | no | Fetch path. Defaults to `/stories/<slug>.md`. |

Story body: `public/stories/<slug>.md`, served at that `path`.

YAML front matter between `---` lines. Unknown fields are ignored. These are read when present:

| Field | Use |
|---|---|
| `title` | Article title. |
| `status` | If this field is present, only `published` is shown. If it is absent, the index entry is still shown. |
| `alert_level` | Badge in the card and the article header. Example: `GDACS Green (lowest)`. |
| `alert_note` | Optional short text explaining the alert level, including why it changed. On the article page it sits beside the badge as a caption, and the badge’s tooltip repeats it. |
| `severity` | Number 1–10. If `alert_level` is missing, the badge falls back to Green 1–3, Orange 4–6, Red 7–10. |
| `updated` | Optional ISO-8601 UTC correction time. Press Room cards show `Updated` plus that time. The article notice repeats it. |
| `update_note` | Optional short correction. When set, an update notice at the top of the article shows this text. |
| `event_type` | Label. |
| `date` | Display date. |
| `timestamp` | ISO-8601 UTC, used if `date` is absent. |
| `location` | Single dateline string. |
| `locations` | YAML list of dateline strings. |
| `sources` | YAML list of http(s) URLs, printed under the article. |
| `source_urls` | JSON array or YAML list of http(s) URLs. Same treatment as `sources`. |
| `brief_id` | Printed as a small id when present. |
| `slug` | Ignored for routing; the index path is what gets fetched. |

A missing index, an empty `stories` array, or a missing markdown file is an empty or “file missing” state. The page does not crash.

The live example is `public/stories/botswana-mozambique-forest-fires-oct-2026.md`. Do not replace publisher files with samples.

### Map layers

| File | URL | Layer |
|---|---|---|
| `public/layers/disaster_events.geojson` | `/layers/disaster_events.geojson` | Disaster |
| `public/layers/conflict_events.geojson` | `/layers/conflict_events.geojson` | Conflict |

Both files should stay present. An empty `features` array is valid and is shown as **No current events**. A failed fetch is a separate “couldn’t load” state.

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "source": "Grok Bot Intel Pipeline",
    "last_updated": "2026-10-16T16:00:57Z",
    "layer": "disaster_events"
  },
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lon, lat] },
      "properties": {
        "id": "string",
        "event_type": "forest_fire",
        "severity_score": 4,
        "summary": "string",
        "source_url": "https://example.com/report",
        "timestamp": "2026-10-16T15:23:11Z",
        "verified": false,
        "bot_note": "event window (GDACS fromdate/todate): 2026-10-07T15:00:00Z to 2026-10-16T15:00:00Z"
      }
    }
  ]
}
```

Coordinates are GeoJSON order, `[longitude, latitude]`. Missing geometry or coordinates outside the valid range are skipped.

Marker color follows GDACS bands on `severity_score`: **Green 1–3, Orange 4–6, Red 7–10**. Size grows with the score. A missing or out-of-range score is a neutral marker, not a false alert. `verified: false` and a missing `verified` value get a dashed ring. Popups show the summary, timestamp, an http(s) source link when the URL is safe, the event window parsed from `bot_note`, and the full `bot_note`.

`bot_note` is the pipeline note. The desk looks for `event window …: <start> to <end>` and also a bare `fromdate`/`todate` pair.

## Other branch

`grokbot/intel-geojson-layers` adds `components/IntelLayers.tsx` and `docs/MAP_INTEL_INTEGRATION.md`. That component fetches the same two GeoJSON files and draws simpler circle markers, with a different color scale (green below 5, orange from 5, red from 8).

This desk’s map is `components/WarMap.tsx`. Do not mount both, or every event is drawn twice and the colors disagree. When that branch lands, keep `WarMap` and drop `IntelLayers`, or make `IntelLayers` re-export `WarMap`. Leave `docs/MAP_INTEL_INTEGRATION.md` as that branch’s pipeline note; the publisher contract for the desk is this README.

## Scripts

```bash
npm install
npm run dev
npm run build
node --experimental-strip-types lib/content.test.ts
```
