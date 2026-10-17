# Nexus News Media

The product frontend is a statically exported Next.js App Router desk in `app/`. It is not the static Smoky Mountain site in `smoky-mountain-site/`. Published content is static files under `public/`. There is no runtime API. Ask Nexus searches those files in the browser.

Netlify builds this app from the root `netlify.toml` (`npm run build`, publish `out`). `smokymountainwebco.netlify.app` is a newer Smoky Mountain page than `smoky-mountain-site/index.html` and does not match this repo, so it does not appear to be deployed from here. The snapshot’s own config is `smoky-mountain-site/netlify.toml`. A site that should keep publishing that folder needs its base directory set to `smoky-mountain-site`.

Each room has its own URL: `/summary`, `/war-room`, `/press`, `/press/<slug>`, `/conspiracy`, `/market-movers`, and `/account`. The nav tabs are links to those routes.

The desk clock uses the viewer’s local time zone. `Intl` supplies the abbreviation, so it is not hardcoded to EDT. A story dateline uses `date`, then `updated`, then `timestamp`, from the markdown first and the index after that.

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
| `stories[].date` | no | Card date, `YYYY-MM-DD` or ISO-8601. First choice for the dateline. |
| `stories[].updated` | no | ISO-8601 UTC. Press Room cards show an Updated label. Also the dateline when `date` is absent. Front matter wins if both are set. |
| `stories[].timestamp` | no | ISO-8601 UTC. Dateline when `date` and `updated` are both absent. |
| `stories[].event_type` | no | Shown as a label. Underscores are spaced. |
| `stories[].alert_level` | no | Badge text. The words Green, Orange, or Red set the color. |
| `stories[].alert_note` | no | Short reason for the alert level. Caption beside the article badge. Front matter wins if both are set. |
| `stories[].summary` | no | Card deck. |
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
| `date` | Display date. First choice for the dateline. |
| `timestamp` | ISO-8601 UTC. Dateline after `date` and `updated`. |
| `location` | Single dateline string. |
| `locations` | YAML list of dateline strings. |
| `sources` | YAML list of http(s) URLs, printed under the article. |
| `source_urls` | JSON array or YAML list of http(s) URLs. Same treatment as `sources`. |
| `brief_id` | Printed as a small id when present. |
| `slug` | Ignored for routing; the index path is what gets fetched. |

A missing index, an empty `stories` array, or a missing markdown file is an empty or “file missing” state. The page does not crash.

The live example is `public/stories/botswana-mozambique-forest-fires-oct-2026.md`. Do not replace publisher files with samples.

### Search, claims, briefs, and sources

| File | Required | Use |
|---|---|---|
| `public/stories/search.json` | yes for Ask Nexus and beat lists | Full text, location, severity, tags, source URLs, `event_type`, and optional `as_of`, `verdict_type`, and `rating`. |
| `public/kb/claims.json` | yes for claim lists | Claims with confidence, room, source links, and contradiction ids. |
| `public/stories/sources.json` | no | Per-slug key findings and source links on the story page. Missing file leaves those sections off. |
| `public/stories/briefs.json` | no | Per-slug suggested questions. Missing file leaves the section off. |

Market stories are search rows whose `event_type` is `market` or `market movers` (also `markets`, `finance`, or `economy` tags). A trading day is one story. It may include `quotes`, an array of `{name, last, prev_close, change_pct, as_of, url}`. The Markets room and the story page render that array as a table: last price, previous close, a change chip, an as-of time, and a source link on each row, plus the story-level `as_of`. The chip color follows the severity band, Green 1–3, Orange 4–6, Red 7–10. A quote can carry its own `severity`; otherwise the story severity is used. When `quotes` is missing or empty, the table is one row built from the story fields `name` (or the title), `last`, `prev_close`, `change_pct`, `as_of`, and `url`. Fact-check stories use `event_type` `fact-check` or `fact_check`, or a matching tag. They stay in a list and do not need coordinates. `verdict_type` styles the card: `debunk` is a red Debunked label, `confirmation` is a green Confirmed label, and a missing value is a neutral Fact-check label. `rating` is printed exactly as written when it is not null.

### Map layers

| File | URL | Layer |
|---|---|---|
| `public/layers/disaster_events.geojson` | `/layers/disaster_events.geojson` | Disaster |
| `public/layers/conflict_events.geojson` | `/layers/conflict_events.geojson` | Conflict |
| `public/layers/markets.geojson` | `/layers/markets.geojson` | Markets (optional) |

Both files should stay present. An empty `features` array with `feed_status` `ok` — or with the field missing — is shown as **No current events**. A failed fetch is a separate “couldn’t load” state.

`feed_status` is optional. It sits on the collection and is mirrored in `metadata.feed_status`. The values are `ok` and `unavailable`. The desk reads the top-level field first, then the metadata copy. A missing field, or any value other than `unavailable`, is treated as `ok`.

When the status is `unavailable`, the layer toggle, the legend, and that layer’s empty state say **&lt;Layer&gt; feed temporarily unavailable** in muted amber. Conflict becomes “Conflict feed temporarily unavailable.” Disaster becomes “Disaster feed temporarily unavailable.” That copy replaces “No current events” for that layer. A healthy feed with zero features still says “No current events.”

```json
{
  "type": "FeatureCollection",
  "feed_status": "ok",
  "metadata": {
    "source": "Grok Bot Intel Pipeline",
    "last_updated": "2026-10-16T16:00:57Z",
    "layer": "disaster_events",
    "feed_status": "ok"
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

Coordinates are GeoJSON order, `[longitude, latitude]`. On the conflict and disaster layers, missing geometry or coordinates outside the valid range are skipped.

`public/layers/markets.geojson` is optional. When the file is absent, the Markets room does not invent quotes. When it is present, every feature with a quote name is listed, including pairs such as BTC/USD and EUR/USD that have null geometry or no coordinates. Only features with a valid point are drawn on the markets map. Quote properties read, in order: name from `name`, `quote`, `symbol`, `pair`, or `ticker`; last price from `last_price`, `last`, or `price`; percent change from `change_pct`, `pct_change`, `percent_change`, `change_percent`, or `change`; severity from `severity_score` or `severity`. A positive change is a green chip and a negative change is a red chip. `feed_status: unavailable` prints “Markets feed temporarily unavailable” and still lists any quotes in the file.

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
