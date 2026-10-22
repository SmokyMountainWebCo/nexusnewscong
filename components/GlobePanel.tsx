'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GevBridge, type AppliedStatus } from '@/lib/gev/bridge';
import {
  DEFAULT_GEV_URL,
  GEV_FOLLOW_KINDS,
  GEV_LAYER_IDS,
  GEV_LAYER_LABELS,
  GEV_PRIMARY_LAYERS,
  type GevFollowKind,
  type GevLayerId,
  type GevViewInput,
  gevBaseUrl,
  gevEmbedUrl,
  isGevLayerId,
} from '@/lib/gev/protocol';
import { coordinatesFromLocation, layersForEvent, parseStoryIndex, type StoryCard } from '@/lib/stories';

const READY_MS = 8000;

type Preset = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  altitude_m: number;
  pitch_deg: number;
  layers: string[];
};

function globalPreset(): Preset {
  return {
    id: 'global',
    label: 'Global',
    lat: 18,
    lon: 150,
    altitude_m: 14000000,
    pitch_deg: -90,
    layers: ['flights', 'ais-live-vessels', 'earthquakes'],
  };
}

function presetsFromStories(stories: StoryCard[]): Preset[] {
  const presets = [globalPreset()];
  for (const story of stories) {
    const point = coordinatesFromLocation(story.location);
    if (!point) continue;
    presets.push({
      id: story.slug,
      label: story.title,
      lat: point.lat,
      lon: point.lon,
      altitude_m: 450000,
      pitch_deg: -45,
      layers: layersForEvent(story.eventType),
    });
  }
  return presets;
}

function viewFromPreset(preset: Preset, follow: GevViewInput['follow']): GevViewInput {
  return {
    camera: {
      lat: preset.lat,
      lon: preset.lon,
      altitude_m: preset.altitude_m,
      heading_deg: 0,
      pitch_deg: preset.pitch_deg,
    },
    layers: preset.layers.filter(isGevLayerId),
    follow: follow ?? null,
  };
}

export default function GlobePanel({ storySlug }: { storySlug?: string | null }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<GevBridge | null>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [baseUrl] = useState(gevBaseUrl);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layers, setLayers] = useState<string[]>(globalPreset().layers);
  const [presetId, setPresetId] = useState('global');
  const [followKind, setFollowKind] = useState<GevFollowKind>('aircraft');
  const [followId, setFollowId] = useState('');
  const [cockpit, setCockpit] = useState(false);
  const [follow, setFollow] = useState<GevViewInput['follow']>(null);
  const [status, setStatus] = useState<AppliedStatus | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const embedSrc = useMemo(() => {
    try {
      return gevEmbedUrl(baseUrl);
    } catch {
      return null;
    }
  }, [baseUrl]);

  const presets = useMemo(() => presetsFromStories(stories), [stories]);
  const activePreset = presets.find((preset) => preset.id === presetId) ?? presets[0];

  useEffect(() => {
    let cancelled = false;
    fetch('/stories/index.json')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setStories(parseStoryIndex(data));
      })
      .catch(() => {
        if (!cancelled) setStories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storySlug) return;
    const match = presets.find((preset) => preset.id === storySlug);
    if (!match) return;
    setPresetId(match.id);
    setLayers(match.layers);
  }, [storySlug, presets]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !embedSrc) return;
    const timer = window.setTimeout(() => setFailed(true), READY_MS);
    const attach = () => {
      if (bridgeRef.current) return;
      const bridge = GevBridge.forFrame(frame, baseUrl, (next, isReady) => {
        if (isReady) {
          window.clearTimeout(timer);
          setReady(true);
          setFailed(false);
        }
        if (next) setStatus(next);
      });
      if (bridge) bridgeRef.current = bridge;
    };
    const onMessage = (event: MessageEvent) => bridgeRef.current?.handle(event);
    attach();
    frame.addEventListener('load', attach);
    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(timer);
      frame.removeEventListener('load', attach);
      window.removeEventListener('message', onMessage);
      bridgeRef.current = null;
    };
  }, [baseUrl, embedSrc]);

  useEffect(() => {
    if (!ready || !activePreset) return;
    const id = bridgeRef.current?.send({
      ...viewFromPreset(activePreset, follow ?? null),
      layers: layers.filter(isGevLayerId),
    });
    if (typeof id === 'number') setPendingId(id);
  }, [ready, activePreset, layers, follow]);

  function toggleLayer(id: GevLayerId) {
    setLayers((current) => (current.includes(id) ? current.filter((layer) => layer !== id) : [...current, id]));
  }

  function choosePreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setLayers(preset.layers);
    setSheetOpen(false);
  }

  function applyFollow() {
    const id = followId.trim();
    if (!id) {
      setFollow(null);
      return;
    }
    const next = {
      kind: followKind,
      id,
      ...((followKind === 'aircraft' || followKind === 'military_aircraft') && cockpit ? { cockpit: true } : {}),
    };
    setFollow(next);
  }

  const moreLayers = GEV_LAYER_IDS.filter((id) => !GEV_PRIMARY_LAYERS.includes(id));
  const disconnected = failed || !embedSrc;
  const statusText = !ready
    ? disconnected
      ? 'Globe not connected'
      : 'Waiting for gev:ready'
    : status
      ? `View ${status.id ?? '—'} ${status.ok ? 'applied' : 'failed'}${status.error ? `: ${status.error}` : ''}`
      : pendingId
        ? `View ${pendingId} sent`
        : 'Connected';

  return (
    <div className="globe">
      <div className="globe__stage">
        {embedSrc ? (
          <iframe
            ref={frameRef}
            className="globe__frame"
            title="God's Eye View"
            src={embedSrc}
            referrerPolicy="no-referrer"
          />
        ) : null}
        {disconnected && (
          <div className="globe__offline" role="status">
            <p className="globe__offline-kicker">God&apos;s Eye View</p>
            <h3>Globe not connected</h3>
            <p>
              The frame at <code>{baseUrl}</code> did not send <code>gev:ready</code>. The desk does not draw a map of its own.
            </p>
            <ol>
              <li>
                Clone <code>https://github.com/bilawalsidhu/gods-eye-view</code> and use Node 24.14+ or 26.
              </li>
              <li>
                Run <code>npm ci</code> then <code>npm run dev</code>. The app listens on {DEFAULT_GEV_URL}.
              </li>
              <li>
                Set <code>GEV_EMBED_FRAME_ANCESTORS</code> to this site&apos;s origin, or <code>*</code>, then restart GEV. Framing is denied otherwise.
              </li>
              <li>
                Point <code>NEXT_PUBLIC_GEV_URL</code> at that origin and rebuild this site. The default is {DEFAULT_GEV_URL}.
              </li>
            </ol>
          </div>
        )}
      </div>
      <button
        type="button"
        className="globe__sheet-toggle"
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen((open) => !open)}
      >
        {sheetOpen ? 'Hide globe controls' : 'Globe controls'}
      </button>
      <aside className={sheetOpen ? 'globe__panel is-open' : 'globe__panel'}>
        <p className={`globe__status${ready && status?.ok !== false ? '' : ' is-waiting'}`}>{statusText}</p>
        <fieldset>
          <legend>Camera</legend>
          <div className="globe__presets">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={preset.id === presetId ? 'is-on' : ''}
                onClick={() => choosePreset(preset.id)}
              >
                {preset.id === 'global' ? 'Global' : preset.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Layers</legend>
          <div className="globe__layers">
            {GEV_PRIMARY_LAYERS.map((id) => (
              <label key={id}>
                <input type="checkbox" checked={layers.includes(id)} onChange={() => toggleLayer(id)} />
                {GEV_LAYER_LABELS[id]}
              </label>
            ))}
          </div>
          <details>
            <summary>More GEV layers</summary>
            <div className="globe__layers">
              {moreLayers.map((id) => (
                <label key={id}>
                  <input type="checkbox" checked={layers.includes(id)} onChange={() => toggleLayer(id)} />
                  {GEV_LAYER_LABELS[id]}
                </label>
              ))}
            </div>
          </details>
        </fieldset>
        <fieldset>
          <legend>Follow</legend>
          <label>
            Kind
            <select value={followKind} onChange={(event) => setFollowKind(event.target.value as GevFollowKind)}>
              {GEV_FOLLOW_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind === 'aircraft' ? 'Aircraft' : kind === 'military_aircraft' ? 'Military aircraft' : 'Satellite'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Id
            <input
              value={followId}
              onChange={(event) => setFollowId(event.target.value)}
              placeholder={followKind === 'satellite' ? 'NORAD catalog number' : 'ICAO 24-bit address'}
              maxLength={16}
            />
          </label>
          {followKind !== 'satellite' ? (
            <label className="globe__check">
              <input type="checkbox" checked={cockpit} onChange={(event) => setCockpit(event.target.checked)} />
              Cockpit view
            </label>
          ) : null}
          <div className="globe__follow-actions">
            <button type="button" onClick={applyFollow}>
              Follow
            </button>
            <button
              type="button"
              onClick={() => {
                setFollow(null);
                setFollowId('');
              }}
            >
              Stop following
            </button>
          </div>
          <p className="globe__hint">Aircraft and military aircraft use an ICAO address. A satellite uses a NORAD catalog number. Ships cannot be followed.</p>
        </fieldset>
      </aside>
    </div>
  );
}
