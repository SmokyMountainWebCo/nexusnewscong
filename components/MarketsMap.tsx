'use client';

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import type { MarketQuote } from '@/lib/desk';
import 'leaflet/dist/leaflet.css';

export default function MarketsMap({ quotes }: { quotes: MarketQuote[] }) {
  const first = quotes[0];
  if (!first || first.lat == null || first.lng == null) return null;
  return (
    <div className="nx-map-frame">
      <MapContainer center={[first.lat, first.lng]} zoom={2} scrollWheelZoom={false} className="nx-map">
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {quotes.map((quote) =>
          quote.lat == null || quote.lng == null ? null : (
            <CircleMarker
              key={quote.id}
              center={[quote.lat, quote.lng]}
              radius={8}
              pathOptions={{
                color: quote.changePct != null && quote.changePct < 0 ? '#ff5d73' : '#7dffb3',
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <strong>{quote.name}</strong>
                <br />
                {quote.price ? `Last ${quote.price}` : 'Price not published'}
              </Popup>
            </CircleMarker>
          ),
        )}
      </MapContainer>
    </div>
  );
}
