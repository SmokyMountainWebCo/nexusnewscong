'use client';

// War-room map for /layers/conflict_events.geojson and /layers/disaster_events.geojson.
// grokbot/intel-geojson-layers also adds components/IntelLayers.tsx for the same files.
// Mount only one of them. See the README reconciliation note.

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import {
  feedUnavailableLabel,
  formatTimestamp,
  labelize,
  markerDiameter,
  parseLayerCollection,
  type AlertBand,
  type FeedStatus,
  type LayerParse,
  type MapEvent,
} from '@/lib/content';
import './map.css';

type LayerName = 'conflict' | 'disaster';
type DeskMarker = L.Marker & { deskEvent?: MapEvent };
type MarkerHit = { marker: DeskMarker; group: L.MarkerClusterGroup };

const BANDS = ['green', 'orange', 'red'] as const;
const BAND_LABEL: Record<AlertBand, string> = {
  green: 'Green',
  orange: 'Orange',
  red: 'Red',
  unknown: 'No score',
};
const BAND_RANGE: Record<Exclude<AlertBand, 'unknown'>, string> = {
  green: '1–3',
  orange: '4–6',
  red: '7–10',
};
const RANK: Record<AlertBand, number> = { unknown: 0, green: 1, orange: 2, red: 3 };

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

function pinIcon(event: MapEvent) {
  const visual = markerDiameter(event.severity);
  const hit = Math.max(44, visual);
  const score = event.severity == null ? '–' : String(event.severity);
  const unverified = event.verified !== true ? ' is-unverified' : '';
  const title =
    event.verified === true ? 'Verified' : event.verified === false ? 'Unverified' : 'Verification not provided';
  return L.divIcon({
    className: 'nx-pin-wrap',
    html: `<span class="nx-pin nx-pin--${event.band}${unverified}" style="width:${visual}px;height:${visual}px" title="${escapeHtml(title)}"><span class="nx-pin__score">${escapeHtml(score)}</span></span>`,
    iconSize: [hit, hit],
    iconAnchor: [hit / 2, hit / 2],
    popupAnchor: [0, -visual / 2],
  });
}

function buildPopup(event: MapEvent) {
  const root = document.createElement('article');
  root.className = 'nx-popup';

  const kicker = document.createElement('p');
  kicker.className = 'nx-popup__kicker';
  kicker.textContent = labelize(event.eventType);

  const flags = document.createElement('div');
  flags.className = 'nx-popup__flags';
  const band = document.createElement('span');
  band.className = `nx-badge nx-badge--${event.band}`;
  band.textContent = event.severity == null ? BAND_LABEL[event.band] : `${BAND_LABEL[event.band]} · ${event.severity}/10`;
  const verified = document.createElement('span');
  verified.className = 'nx-badge nx-badge--unknown';
  verified.textContent =
    event.verified === true ? 'Verified' : event.verified === false ? 'Unverified' : 'Verification not provided';
  flags.append(band, verified);

  const summary = document.createElement('p');
  summary.className = 'nx-popup__summary';
  summary.textContent = event.summary || 'No summary filed.';

  const list = document.createElement('dl');
  addFact(list, 'Time', event.timestampLabel);
  if (event.eventWindow) addFact(list, 'Event window', event.eventWindow);
  if (event.sourceUrl) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = 'Source';
    const detail = document.createElement('dd');
    const link = document.createElement('a');
    link.href = event.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open source';
    detail.append(link);
    row.append(term, detail);
    list.append(row);
  } else {
    addFact(list, 'Source', event.sourceRaw ? 'Link unavailable' : 'No source link');
  }

  root.append(kicker, flags, summary, list);
  if (event.botNote) {
    const note = document.createElement('p');
    note.className = 'nx-popup__note';
    const label = document.createElement('span');
    label.textContent = 'Desk note';
    note.append(label, document.createTextNode(event.botNote));
    root.append(note);
  }
  return root;
}

function addFact(list: HTMLDListElement, term: string, detail: string) {
  const wrap = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = detail;
  wrap.append(dt, dd);
  list.append(wrap);
}

function markerTitle(event: MapEvent) {
  const flag = event.verified === true ? 'verified' : 'unverified';
  return `${labelize(event.eventType)}, ${BAND_LABEL[event.band]} ${event.severity ?? ''}, ${flag}`;
}

function FitOnce({ events }: { events: MapEvent[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || events.length === 0) return;
    const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng]));
    map.fitBounds(bounds.pad(0.3), { animate: !prefersReducedMotion(), padding: [28, 28] });
    done.current = true;
  }, [events, map]);
  return null;
}

function Painter({
  events,
  indexRef,
}: {
  events: MapEvent[];
  indexRef: MutableRefObject<Map<string, MarkerHit>>;
}) {
  const map = useMap();
  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 7,
      animate: !prefersReducedMotion(),
      iconCreateFunction(cluster) {
        const children = cluster.getAllChildMarkers() as DeskMarker[];
        let rank = 0;
        let unverified = false;
        for (const child of children) {
          if (!child.deskEvent) continue;
          rank = Math.max(rank, RANK[child.deskEvent.band]);
          if (child.deskEvent.verified !== true) unverified = true;
        }
        const band = (Object.keys(RANK) as AlertBand[]).find((key) => RANK[key] === rank) || 'unknown';
        return L.divIcon({
          className: 'nx-cluster-wrap',
          html: `<span class="nx-cluster nx-cluster--${band}${unverified ? ' is-unverified' : ''}">${cluster.getChildCount()}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      },
    });
    const next = new Map<string, MarkerHit>();
    for (const event of events) {
      const marker = L.marker([event.lat, event.lng], {
        icon: pinIcon(event),
        title: markerTitle(event),
        alt: markerTitle(event),
        keyboard: true,
        riseOnHover: true,
      }) as DeskMarker;
      marker.deskEvent = event;
      marker.bindPopup(buildPopup(event), { maxWidth: 320, minWidth: 240, autoPan: true });
      group.addLayer(marker);
      next.set(event.id, { marker, group });
    }
    map.addLayer(group);
    indexRef.current = next;
    return () => {
      map.removeLayer(group);
      indexRef.current = new Map();
    };
  }, [events, indexRef, map]);
  return null;
}

function FlyTo({
  focus,
  indexRef,
}: {
  focus: { id: string; nonce: number } | null;
  indexRef: MutableRefObject<Map<string, MarkerHit>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const hit = indexRef.current.get(focus.id);
    if (!hit) return;
    const open = () => hit.marker.openPopup();
    if (prefersReducedMotion()) {
      map.setView(hit.marker.getLatLng(), Math.max(map.getZoom(), 6), { animate: false });
      window.setTimeout(open, 0);
      return;
    }
    hit.group.zoomToShowLayer(hit.marker, open);
  }, [focus, indexRef, map]);
  return null;
}

function ZoomHome() {
  const map = useMap();
  useEffect(() => {
    map.zoomControl?.setPosition('bottomright');
  }, [map]);
  return null;
}

async function readLayer(file: string, layer: LayerName): Promise<LayerParse> {
  const response = await fetch(`/layers/${file}.geojson`, { cache: 'no-store' });
  if (!response.ok) throw new Error(String(response.status));
  return parseLayerCollection(await response.json(), layer);
}

export default function WarMap() {
  const [conflict, setConflict] = useState<LayerParse | null>(null);
  const [disaster, setDisaster] = useState<LayerParse | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [disasterError, setDisasterError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [layersOn, setLayersOn] = useState<Record<LayerName, boolean>>({ conflict: true, disaster: true });
  const [bandsOn, setBandsOn] = useState<Record<AlertBand, boolean>>({
    green: true,
    orange: true,
    red: true,
    unknown: true,
  });
  const [showUnverified, setShowUnverified] = useState(true);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const indexRef = useRef<Map<string, MarkerHit>>(new Map());

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      const [conflictResult, disasterResult] = await Promise.allSettled([
        readLayer('conflict_events', 'conflict'),
        readLayer('disaster_events', 'disaster'),
      ]);
      if (cancel) return;
      if (conflictResult.status === 'fulfilled') {
        setConflict(conflictResult.value);
        setConflictError(false);
      } else setConflictError(true);
      if (disasterResult.status === 'fulfilled') {
        setDisaster(disasterResult.value);
        setDisasterError(false);
      } else setDisasterError(true);
      setLoading(false);
    };
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, []);

  const allEvents = useMemo(
    () => [...(conflict?.events ?? []), ...(disaster?.events ?? [])],
    [conflict, disaster]
  );
  const visible = useMemo(
    () =>
      allEvents.filter((event) => {
        if (!layersOn[event.layer]) return false;
        if (!bandsOn[event.band]) return false;
        if (!showUnverified && event.verified !== true) return false;
        return true;
      }),
    [allEvents, bandsOn, layersOn, showUnverified]
  );

  const enabledCounts = {
    conflict: layersOn.conflict ? conflict?.events.length ?? 0 : 0,
    disaster: layersOn.disaster ? disaster?.events.length ?? 0 : 0,
  };
  const enabledLayers = (
    [
      layersOn.conflict && !conflictError ? { label: 'Conflict', loaded: conflict } : null,
      layersOn.disaster && !disasterError ? { label: 'Disaster', loaded: disaster } : null,
    ] as Array<{ label: string; loaded: LayerParse | null } | null>
  ).filter((layer): layer is { label: string; loaded: LayerParse | null } => Boolean(layer));
  const enabledEmpty =
    !loading && enabledLayers.length > 0 && enabledLayers.every((layer) => (layer.loaded?.events.length ?? 0) === 0);
  const unavailableEnabled = enabledLayers.filter((layer) => layer.loaded?.feedStatus === 'unavailable');
  const quietEnabled = enabledLayers.filter(
    (layer) => layer.loaded && layer.loaded.feedStatus !== 'unavailable' && layer.loaded.events.length === 0
  );
  const filteredEmpty = !loading && !enabledEmpty && visible.length === 0 && (layersOn.conflict || layersOn.disaster);
  const feedNotices = [
    conflict && !conflictError && conflict.feedStatus === 'unavailable' ? feedUnavailableLabel('Conflict') : null,
    disaster && !disasterError && disaster.feedStatus === 'unavailable' ? feedUnavailableLabel('Disaster') : null,
  ].filter((notice): notice is string => Boolean(notice));

  return (
    <div className="nx-war">
      <div className="nx-toolbar" role="group" aria-label="Map layers">
        <LayerToggle
          pressed={layersOn.conflict}
          onClick={() => setLayersOn((current) => ({ ...current, conflict: !current.conflict }))}
          label="Conflict"
          count={conflictError ? null : conflict?.events.length ?? null}
          feedStatus={conflictError ? 'ok' : conflict?.feedStatus}
        />
        <LayerToggle
          pressed={layersOn.disaster}
          onClick={() => setLayersOn((current) => ({ ...current, disaster: !current.disaster }))}
          label="Disaster"
          count={disasterError ? null : disaster?.events.length ?? null}
          feedStatus={disasterError ? 'ok' : disaster?.feedStatus}
        />
        <button type="button" className="nx-toggle" aria-pressed={showUnverified} onClick={() => setShowUnverified((value) => !value)}>
          Unverified
        </button>
      </div>
      <div className="nx-legend" role="group" aria-label="GDACS alert bands">
        {BANDS.map((band) => (
          <button
            key={band}
            type="button"
            className="nx-toggle"
            aria-pressed={bandsOn[band]}
            onClick={() => setBandsOn((current) => ({ ...current, [band]: !current[band] }))}
          >
            <span className={`nx-swatch nx-swatch--${band}`} aria-hidden="true" />
            {BAND_LABEL[band]} {BAND_RANGE[band]}
          </button>
        ))}
        <span className="nx-legend-note">
          <span className="nx-swatch is-unverified" aria-hidden="true" />
          Dashed ring marks an unverified feature. Larger marks are higher scores.
        </span>
        {feedNotices.map((notice) => (
          <span key={notice} className="nx-legend-note nx-legend-note--feed" role="status">
            {notice}
          </span>
        ))}
      </div>
      <div className="nx-stage">
        <div className="nx-map-frame">
          <MapContainer
            center={[12, 18]}
            zoom={2}
            minZoom={2}
            scrollWheelZoom
            zoomSnap={0.5}
            wheelPxPerZoomLevel={110}
            className="nx-leaflet"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            <ZoomHome />
            <FitOnce events={allEvents} />
            <Painter events={visible} indexRef={indexRef} />
            <FlyTo focus={focus} indexRef={indexRef} />
          </MapContainer>
          {enabledEmpty ? (
            <div className={unavailableEnabled.length ? 'nx-map-empty nx-map-empty--feed' : 'nx-map-empty'} role="status">
              <div>
                {unavailableEnabled.length ? (
                  unavailableEnabled.map((layer) => (
                    <strong key={layer.label}>{feedUnavailableLabel(layer.label)}</strong>
                  ))
                ) : (
                  <strong>No current events</strong>
                )}
                <p>
                  {unavailableEnabled.length
                    ? quietEnabled.length
                      ? `${quietEnabled.map((layer) => layer.label).join(' and ')}: No current events.`
                      : 'The latest file marked this feed unavailable.'
                    : 'The layers that are on have no features in the latest files.'}
                </p>
              </div>
            </div>
          ) : null}
          {filteredEmpty ? (
            <div className="nx-map-empty" role="status">
              <div>
                <strong>No events match these filters</strong>
                <p>Turn a band or the unverified switch back on to see the layer.</p>
              </div>
            </div>
          ) : null}
        </div>
        <aside className="nx-side" aria-label="Event list">
          <LayerSection
            title="Conflict"
            error={conflictError}
            loaded={conflict}
            events={visible.filter((event) => event.layer === 'conflict')}
            active={layersOn.conflict}
            selectedId={focus?.id ?? null}
            onSelect={(id) => setFocus({ id, nonce: Date.now() })}
          />
          <LayerSection
            title="Disaster"
            error={disasterError}
            loaded={disaster}
            events={visible.filter((event) => event.layer === 'disaster')}
            active={layersOn.disaster}
            selectedId={focus?.id ?? null}
            onSelect={(id) => setFocus({ id, nonce: Date.now() })}
          />
        </aside>
      </div>
      <p className="nx-legend-note">
        {feedNotices.length
          ? 'A feed marked unavailable stays listed in amber until the file reports ok.'
          : enabledCounts.conflict + enabledCounts.disaster === 0 && !loading
            ? 'Empty layers stay listed so a quiet feed is obvious.'
            : 'Choose an event to move the map. Plus and minus zoom the desk. Layers refresh every five minutes.'}
        {conflict?.skipped || disaster?.skipped
          ? ` ${(conflict?.skipped || 0) + (disaster?.skipped || 0)} features were left off because they had no usable coordinates.`
          : ''}
      </p>
    </div>
  );
}

function LayerToggle({
  pressed,
  onClick,
  label,
  count,
  feedStatus,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  count: number | null;
  feedStatus?: FeedStatus;
}) {
  const unavailable = feedStatus === 'unavailable';
  return (
    <button
      type="button"
      className={unavailable ? 'nx-toggle nx-toggle--feed' : 'nx-toggle'}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {unavailable ? <span className="nx-feed-note">{feedUnavailableLabel(label)}</span> : label}
      {unavailable ? null : <small>{count == null ? '…' : count}</small>}
    </button>
  );
}

function LayerSection({
  title,
  error,
  loaded,
  events,
  active,
  selectedId,
  onSelect,
}: {
  title: string;
  error: boolean;
  loaded: LayerParse | null;
  events: MapEvent[];
  active: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!active) return null;
  const updated = loaded?.updated ? formatTimestamp(loaded.updated) : null;
  return (
    <section>
      <h3>
        {title}
        <span>{error ? 'Unavailable' : loaded ? loaded.events.length : '…'}</span>
      </h3>
      {updated ? <p className="nx-legend-note">Updated {updated}</p> : null}
      {error ? (
        <p className="nx-empty" role="status">
          <strong>Couldn’t load this layer</strong>
          The map is still here. The file may be missing.
        </p>
      ) : !loaded ? (
        <p className="nx-legend-note" role="status">Loading layer…</p>
      ) : loaded.feedStatus === 'unavailable' && loaded.events.length === 0 ? (
        <p className="nx-empty nx-empty--feed" role="status">
          <strong>{feedUnavailableLabel(title)}</strong>
          The latest file marked this feed unavailable.
        </p>
      ) : loaded.events.length === 0 ? (
        <p className="nx-empty" role="status">
          <strong>No current events</strong>
          This layer’s latest file has no features.
        </p>
      ) : events.length === 0 ? (
        <p className="nx-empty" role="status">No events match these filters.</p>
      ) : (
        <ul className="nx-event-list">
          {events
            .slice()
            .sort((a, b) => (b.severity ?? -1) - (a.severity ?? -1))
            .map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={selectedId === event.id ? 'nx-event is-selected' : 'nx-event'}
                  onClick={() => onSelect(event.id)}
                >
                  <span className={`nx-pip nx-pip--${event.band}${event.verified !== true ? ' is-unverified' : ''}`} aria-hidden="true" />
                  <span>
                    <strong>{labelize(event.eventType)}</strong>
                    <span>
                      {BAND_LABEL[event.band]}
                      {event.severity != null ? ` · ${event.severity}/10` : ''}
                      {event.verified === false ? ' · Unverified' : event.verified == null ? ' · Verification not provided' : ''}
                    </span>
                    <span>{event.timestampLabel}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
