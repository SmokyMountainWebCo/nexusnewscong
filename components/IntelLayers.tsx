'use client';
// Nexus intel map layers. Renders /data/conflict_events.geojson and /data/disaster_events.geojson.
// Must be loaded with next/dynamic({ ssr: false }) because Leaflet needs `window`.
import { useEffect, useState } from 'react';
import { GeoJSON, LayersControl } from 'react-leaflet';
import L from 'leaflet';

type Layer = { type: 'FeatureCollection'; metadata: { source: string; last_updated: string; layer: string }; features: any[] };
const color = (s: number) => (s >= 8 ? '#ef4444' : s >= 5 ? '#f97316' : '#22c55e');

function useLayer(name: string) {
  const [data, setData] = useState<Layer | null>(null);
  useEffect(() => {
    const load = () => fetch(`/data/${name}.geojson`, { cache: 'no-store' }).then(r => r.json()).then(setData).catch(() => {});
    load(); const t = setInterval(load, 5 * 60 * 1000); return () => clearInterval(t);
  }, [name]);
  return data;
}

export default function IntelLayers() {
  const conflict = useLayer('conflict_events');
  const disaster = useLayer('disaster_events');
  const render = (d: Layer | null) => d && (
    <GeoJSON key={d.metadata.last_updated} data={d as any}
      pointToLayer={(f: any, latlng) => L.circleMarker(latlng, {
        radius: 4 + f.properties.severity_score, color: color(f.properties.severity_score),
        dashArray: f.properties.verified ? undefined : '3', weight: 2, fillOpacity: 0.5 })}
      onEachFeature={(f: any, layer) => {
        const p = f.properties; const esc = (s: string) => String(s).replace(/[<>&"]/g, c => `&#${c.charCodeAt(0)};`);
        layer.bindPopup(`<b>${esc(p.event_type)}</b> · severity ${p.severity_score}/10${p.verified ? ' · verified' : ' · unverified'}<br/>`
          + `${esc(p.summary)}<br/><small>${esc(p.timestamp)}</small><br/><a href="${esc(p.source_url)}" target="_blank" rel="noopener">source</a>`);
      }} />
  );
  return (
    <LayersControl position="topright">
      <LayersControl.Overlay checked name="Conflict events">{render(conflict) || <></>}</LayersControl.Overlay>
      <LayersControl.Overlay checked name="Disaster events (GDACS)">{render(disaster) || <></>}</LayersControl.Overlay>
    </LayersControl>
  );
}
