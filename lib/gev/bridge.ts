// Parent-side bridge for a God's Eye View iframe.
//
// Protocol (src/app/embed.js):
//   Parent  -> iframe : { type: 'gev:view', id, view }
//   iframe  -> parent : { type: 'gev:ready' } once the globe can take views
//   iframe  -> parent : { type: 'gev:view-applied', id, ok, steps | error }
// Answers are posted to the origin that sent the view. This bridge ignores
// any message whose event.origin is not the configured GEV origin, and it
// does not post a view until gev:ready arrives.
//
// Run GEV separately (Node 24.14+ or 26): npm ci && npm run dev
// It listens on http://localhost:4173. Framing is denied unless
// GEV_EMBED_FRAME_ANCESTORS names this site, or is "*".
// NEXT_PUBLIC_GEV_URL overrides the iframe address. The default is
// http://localhost:4173.

import {
  GEV_APPLIED_MESSAGE,
  GEV_READY_MESSAGE,
  type GevAppliedMessage,
  type GevViewInput,
  gevOrigin,
  viewMessage,
} from './protocol.ts';

export type AppliedStatus = {
  id: number | null;
  ok: boolean;
  error?: string;
  steps?: GevAppliedMessage['steps'];
};

type Listener = (status: AppliedStatus | null, ready: boolean) => void;

export class GevBridge {
  private nextId = 1;
  private ready = false;
  private queued: GevViewInput | null = null;
  private frame: HTMLIFrameElement | null = null;
  private readonly target: Window | null;
  private readonly origin: string;
  private readonly onChange: Listener;

  constructor(target: Window | null, origin: string, onChange: Listener) {
    this.target = target;
    this.origin = origin;
    this.onChange = onChange;
  }

  static forFrame(frame: HTMLIFrameElement, baseUrl: string, onChange: Listener): GevBridge | null {
    const origin = gevOrigin(baseUrl);
    if (!origin) return null;
    // Resolve contentWindow when a message arrives. The window captured
    // before the iframe navigates is about:blank and drops gev:ready.
    const bridge = new GevBridge(null, origin, onChange);
    bridge.frame = frame;
    return bridge;
  }

  private peer(): Window | null {
    return this.frame?.contentWindow ?? this.target;
  }

  handle(event: { origin: string; source?: unknown; data: unknown }): void {
    if (event.origin !== this.origin) return;
    const peer = this.peer();
    if (!peer) return;
    if (event.source != null && event.source !== peer) return;
    if (!event.data || typeof event.data !== 'object') return;
    const data = event.data as { type?: unknown; id?: unknown; ok?: unknown; error?: unknown; steps?: GevAppliedMessage['steps'] };
    if (data.type === GEV_READY_MESSAGE) {
      this.ready = true;
      this.onChange(null, true);
      if (this.queued) {
        const view = this.queued;
        this.queued = null;
        this.post(view);
      }
      return;
    }
    if (data.type === GEV_APPLIED_MESSAGE) {
      const applied = data as GevAppliedMessage;
      this.onChange(
        {
          id: typeof applied.id === 'number' ? applied.id : null,
          ok: applied.ok === true,
          error: typeof applied.error === 'string' ? applied.error : undefined,
          steps: Array.isArray(applied.steps) ? applied.steps : undefined,
        },
        this.ready,
      );
    }
  }

  send(view: GevViewInput): number | null {
    if (!this.ready) {
      this.queued = view;
      return null;
    }
    return this.post(view);
  }

  get isReady(): boolean {
    return this.ready;
  }

  private post(view: GevViewInput): number {
    const id = this.nextId;
    this.nextId += 1;
    const peer = this.peer();
    if (!peer) return id;
    peer.postMessage(viewMessage(id, view), this.origin);
    return id;
  }
}
