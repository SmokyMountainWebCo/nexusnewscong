import { displayAsOf } from './investigation.ts';

export type TrailStage = 0 | 1 | 2;
export type TrailStatus = 'verified' | 'unverified' | 'disproven' | 'neutral';

export type TrailStep = {
  stage: TrailStage;
  stageName: string;
  label: string;
  at: string | null;
  status: TrailStatus;
  platform: string | null;
  sourceLabel: string | null;
  sourceHref: string | null;
};

const STAGE_NAMES: Record<TrailStage, string> = {
  0: 'Origin signal',
  1: 'X triangulation',
  2: 'Primary record',
};

function asText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asStage(value: unknown): TrailStage | null {
  const text = asText(value);
  if (text === '0' || text === '1' || text === '2') return Number(text) as TrailStage;
  return null;
}

function asStatus(value: unknown): TrailStatus {
  const text = (asText(value) || '').toLowerCase();
  if (text === 'verified' || text === 'unverified' || text === 'disproven') return text;
  return 'neutral';
}

function httpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url;
  } catch {
    return null;
  }
  return null;
}

function hostname(url: URL): string {
  return url.hostname.replace(/^www\./, '');
}

export function parseTrail(value: unknown): TrailStep[] {
  if (!Array.isArray(value)) return [];
  const steps: TrailStep[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const item = row as Record<string, unknown>;
    const stage = asStage(item.stage);
    const label = asText(item.label);
    if (stage == null || !label) continue;
    const source = asText(item.source);
    const url = source ? httpUrl(source) : null;
    const at = displayAsOf(asText(item.at));
    if (stage === 0) {
      steps.push({
        stage,
        stageName: STAGE_NAMES[stage],
        label,
        at,
        status: asStatus(item.status),
        platform: url ? hostname(url) : source,
        sourceLabel: url ? hostname(url) : source,
        sourceHref: null,
      });
      continue;
    }
    steps.push({
      stage,
      stageName: STAGE_NAMES[stage],
      label,
      at,
      status: asStatus(item.status),
      platform: null,
      sourceLabel: url ? url.toString() : source,
      sourceHref: url ? url.toString() : null,
    });
  }
  return steps;
}

/** First non-empty trail wins, the same way a present developing flag is kept. */
export function resolveTrail(...sources: unknown[]): TrailStep[] {
  for (const source of sources) {
    const steps = parseTrail(source);
    if (steps.length) return steps;
  }
  return [];
}
