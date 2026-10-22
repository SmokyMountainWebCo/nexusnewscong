// God's Eye View embed protocol, taken from gods-eye-view src/app/embed.js
// and src/view/index.js (createView / VIEW_PROPERTIES / REGISTERED_LAYER_IDS).
// A parent posts { type: 'gev:view', id, view }. The iframe posts
// { type: 'gev:ready' } once, then { type: 'gev:view-applied', id, ok, steps }
// back to the origin that sent the view.

export const GEV_VIEW_MESSAGE = 'gev:view';
export const GEV_APPLIED_MESSAGE = 'gev:view-applied';
export const GEV_READY_MESSAGE = 'gev:ready';

export const DEFAULT_GEV_URL = 'http://localhost:4173';

/** Layer ids from LAYER_STATE_REGISTRY in src/data/layerState.js. */
export const GEV_LAYER_IDS = [
  'air-quality',
  'ais-live-vessels',
  'alpr-cameras',
  'bhote-koshi-2026',
  'bhote-koshi-locator',
  'bikeshare',
  'cctv',
  'directions',
  'earthquakes',
  'fire-perimeters',
  'flights',
  'gnss-integrity',
  'local-dams',
  'local-datacenters',
  'local-firms',
  'military',
  'military-awareness',
  'military-installations',
  'radio',
  'recent-imagery',
  'rocket-launches',
  'satellites',
  'street-level',
  'telegeography-submarine-cables',
  'traffic',
  'transit',
  'weather-cyclones',
  'weather-lightning',
  'weather-radar',
  'weather-satellite',
  'wind',
] as const;

export type GevLayerId = (typeof GEV_LAYER_IDS)[number];

/** Follow kinds from VIEW_FOLLOW_KINDS. Ships are not followable. */
export const GEV_FOLLOW_KINDS = ['aircraft', 'military_aircraft', 'satellite'] as const;
export type GevFollowKind = (typeof GEV_FOLLOW_KINDS)[number];

export type GevCamera = {
  lat: number;
  lon: number;
  altitude_m?: number;
  heading_deg?: number;
  pitch_deg?: number;
};

export type GevFollow = {
  kind: GevFollowKind;
  id: string;
  cockpit?: boolean;
};

/** The object createView() accepts. Unknown layer ids are dropped by GEV. */
export type GevViewInput = {
  camera: GevCamera;
  layers?: string[];
  style?: 'normal' | 'retro' | 'surveillance' | 'thermal' | 'anime' | 'noir' | 'snow' | null;
  map?: 'photoreal' | 'bing-aerial' | 'bing-labels' | 'esri-imagery' | 'osm' | null;
  follow?: GevFollow | null;
};

export type GevReadyMessage = { type: typeof GEV_READY_MESSAGE };
export type GevAppliedStep = { step: string; ok: boolean; error?: string };
export type GevAppliedMessage = {
  type: typeof GEV_APPLIED_MESSAGE;
  id: number | null;
  ok: boolean;
  steps?: GevAppliedStep[];
  error?: string;
};
export type GevViewMessage = {
  type: typeof GEV_VIEW_MESSAGE;
  id: number;
  view: GevViewInput;
};

export const GEV_LAYER_LABELS: Record<GevLayerId, string> = {
  'air-quality': 'Air quality',
  'ais-live-vessels': 'Ships',
  'alpr-cameras': 'ALPR cameras',
  'bhote-koshi-2026': 'Bhote Koshi 2026',
  'bhote-koshi-locator': 'Bhote Koshi locator',
  bikeshare: 'Bikeshare',
  cctv: 'CCTV',
  directions: 'Directions',
  earthquakes: 'Earthquakes',
  'fire-perimeters': 'Fire perimeters',
  flights: 'Aircraft',
  'gnss-integrity': 'GNSS integrity',
  'local-dams': 'Dams',
  'local-datacenters': 'Data centers',
  'local-firms': 'Fires',
  military: 'Military aircraft',
  'military-awareness': 'Military awareness',
  'military-installations': 'Military installations',
  radio: 'Radio',
  'recent-imagery': 'Recent imagery',
  'rocket-launches': 'Rocket launches',
  satellites: 'Satellites',
  'street-level': 'Street level',
  'telegeography-submarine-cables': 'Submarine cables',
  traffic: 'Traffic',
  transit: 'Transit',
  'weather-cyclones': 'Cyclones',
  'weather-lightning': 'Lightning',
  'weather-radar': 'Weather radar',
  'weather-satellite': 'Weather satellite',
  wind: 'Wind',
};

export const GEV_PRIMARY_LAYERS: GevLayerId[] = [
  'flights',
  'military',
  'ais-live-vessels',
  'satellites',
  'earthquakes',
  'local-firms',
  'fire-perimeters',
  'weather-cyclones',
  'weather-radar',
  'weather-satellite',
  'weather-lightning',
  'wind',
];

export function gevBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_GEV_URL?.trim();
  return configured || DEFAULT_GEV_URL;
}

export function gevOrigin(baseUrl: string): string | null {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

/** iframe address. GEV shows only the globe when embed=1. */
export function gevEmbedUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('embed', '1');
  return url.toString();
}

export function isGevLayerId(value: string): value is GevLayerId {
  return (GEV_LAYER_IDS as readonly string[]).includes(value);
}

export function viewMessage(id: number, view: GevViewInput): GevViewMessage {
  return { type: GEV_VIEW_MESSAGE, id, view };
}
