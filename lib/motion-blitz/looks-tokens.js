// Motion Blitz look and grade tokens, vendored verbatim from
// packages/looks/looks.js (LOOKS) and packages/looks/lut.js (GRADES).
// Original code (MIT). Values are not restyled for the Nexus page theme.

export const TOKENS = ['bg', 'surface', 'surface_raised', 'line', 'ink', 'ink_muted', 'mist', 'fog', 'shadow', 'accent', 'accent_ink', 'glow'];

export const LOOKS = {
  black_mist: {
    label: 'Black + Mist',
    source: ['#0D0D0D', '#F7F6F3', '#D6DCE1', '#6B7783', '#1E2A22', '#D4CEC2', '#A4B09A', '#33383F'],
    fixed: { bg: '#0D0D0D', surface: '#33383F', ink: '#F7F6F3', mist: '#D6DCE1', ink_muted: '#6B7783', line: '#4A4F57', accent: '#D4CEC2', shadow: '#1E2A22' },
    chromaMax: 0.06,
    light: { key: { kelvin: 7800, intensity: 1.0 }, fill: { kelvin: 6500, ratio: 6 }, rim: { kelvin: 2700, intensity: 0.9 }, practical: { kelvin: 2400 } },
    exposure: 1.0,
    post: { grain: 0.05, vignette: 0.32, bloom: 0.55, halation: 0.2 },
  },
  smoky_dusk: {
    label: 'Smoky dusk',
    source: ['#14181C', '#E9E3D6', '#9AA7B3', '#3B4A55', '#C98A4B'],
    chromaMax: 0.09,
    light: { key: { kelvin: 3600, intensity: 1.0 }, fill: { kelvin: 9000, ratio: 4 }, rim: { kelvin: 2600, intensity: 1.2 }, practical: { kelvin: 2300 } },
    exposure: 1.05,
  },
  industrial_tungsten: {
    label: 'Industrial tungsten',
    source: ['#121110', '#EDE6DA', '#8C8378', '#3A3530', '#D98E3B'],
    chromaMax: 0.1,
  },
  warm_amber: {
    label: 'Warm amber',
    source: ['#140E09', '#F3E6D2', '#B98A5A', '#4A3322', '#E0913A'],
    chromaMax: 0.11,
  },
  noir_monochrome: {
    label: 'Noir monochrome',
    source: ['#0B0B0B', '#F4F4F2', '#9A9A97', '#3A3A39', '#D8D8D4'],
    chromaMax: 0.0,
  },
  swiss_editorial: {
    label: 'Swiss editorial',
    source: ['#F2F0EB', '#151515', '#8A8A85', '#D7D3CA', '#C8402F'],
    chromaMax: 0.08,
  },
};

/** Grades per look. tint hexes are directions only: their OKLab hue and chroma set the push. */
export const GRADES = {
  black_mist: { contrast: 1.22, pivot: 0.6, lift: 0.085, shoulder: 0.94, saturation: 0.86, shadowTint: '#1E2A22', shadowAmt: 0.55, highTint: '#D4CEC2', highAmt: 0.35 },
  smoky_dusk: { contrast: 1.1, pivot: 0.45, lift: 0.09, shoulder: 0.95, saturation: 0.95, shadowTint: '#203448', shadowAmt: 0.6, highTint: '#E2B07A', highAmt: 0.45 },
  industrial_tungsten: { contrast: 1.18, pivot: 0.4, lift: 0.08, shoulder: 0.93, saturation: 0.9, shadowTint: '#1C2A30', shadowAmt: 0.5, highTint: '#E8A25A', highAmt: 0.5 },
  warm_amber: { contrast: 1.12, pivot: 0.45, lift: 0.08, shoulder: 0.94, saturation: 1.05, shadowTint: '#2A1A10', shadowAmt: 0.45, highTint: '#F0B26A', highAmt: 0.55 },
  noir_monochrome: { contrast: 1.3, pivot: 0.5, lift: 0.06, shoulder: 0.95, saturation: 0.0, shadowTint: '#101010', shadowAmt: 0.0, highTint: '#F4F4F2', highAmt: 0.0 },
  swiss_editorial: { contrast: 1.04, pivot: 0.5, lift: 0.06, shoulder: 0.97, saturation: 1.0, shadowTint: '#151515', shadowAmt: 0.0, highTint: '#F2F0EB', highAmt: 0.0 },
};
