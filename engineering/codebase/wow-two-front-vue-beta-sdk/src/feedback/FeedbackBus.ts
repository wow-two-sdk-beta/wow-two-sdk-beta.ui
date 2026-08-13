import type { VNode } from 'vue';

import { Severity } from '../foundation/utils';

/** Defines the tone of a notice — the house `Severity` vocabulary minus `neutral` (a notice always carries intent). */
export const NoticeTone = {
  /** Refers to an informational notice. */
  Info: Severity.Info,
  /** Refers to a positive / success notice. */
  Success: Severity.Success,
  /** Refers to a caution / warning notice. */
  Warning: Severity.Warning,
  /** Refers to a destructive / error notice. */
  Danger: Severity.Danger,
} as const;

export type NoticeTone = (typeof NoticeTone)[keyof typeof NoticeTone];

/**
 * A renderable slice of a notice. React's `ReactNode` becomes `string | VNode`
 * for the same reason the `Toaster` payload did: notices travel as data through
 * `notify()`, not through a slot, so a caller who wants markup builds it with
 * `h()`. Structurally identical to `presentation/feedback`'s `ToastNode` — the
 * adapter's assignment is what keeps the two from drifting, and this module
 * cannot import that one (boundaries: `feedback` never reaches into
 * `presentation`).
 */
export type NoticeNode = string | VNode;

/** Defines a feedback notice published on the bus — the headless payload a presentation adapter renders (toast, banner, notification center…). */
export interface FeedbackNotice {
  /** The semantic tone — maps 1:1 onto the toast `severity` vocabulary. */
  readonly tone: NoticeTone;

  /** The headline. */
  readonly title: NoticeNode;

  /** The optional supporting body. */
  readonly description?: NoticeNode;

  /** An optional action slot (e.g. a retry button) — passed through to the rendering surface. */
  readonly action?: NoticeNode;

  /** An optional stable identity — assigned by the bus (`n_<seq>`) when omitted; callers set it for future dedupe / notification-center use. */
  readonly id?: string;

  /** ms before the rendering surface auto-dismisses. Surface default when omitted; `Infinity` = sticky. */
  readonly durationMs?: number;
}

/** Defines a notice as delivered to subscribers — identity always assigned. */
export interface PublishedNotice extends FeedbackNotice {
  readonly id: string;
}

/** Defines a listener notified on every published notice. */
export type NoticeListener = (notice: PublishedNotice) => void;

/**
 * Defines the module-scope feedback hub wiring app code to whatever surface renders notices.
 * Fire-and-forget pub/sub (no replay): a notice published with no subscriber is dropped, so mount
 * the adapter (`<FeedbackToasts/>`) before publishing. Nothing subscribes automatically — GWDNBM,
 * every wire is explicit:
 *
 * - **Notices in** — `notify({ tone, title })` from anywhere (composables, api client code, stores);
 *   `feedbackQueryErrors(bus)` plugs a `/query` global error seam in.
 * - **Toasts out** — `<FeedbackToasts/>` (`/presentation/feedback`) subscribes and forwards each
 *   notice into the imperative `toaster.toast()` API.
 *
 * Plain module state rather than a Vue plugin / `provide`: the bus is publisher-agnostic, and a
 * publisher is rarely inside a component's `setup()` (an interceptor, a store action). The
 * `bus` prop on the adapter is the isolation seam an app needs instead.
 */
export interface FeedbackBus {
  /** Publishes a notice to all subscribers — safe to call with none mounted (no-op); returns the notice id. */
  notify(notice: FeedbackNotice): string;

  /** Subscribes to published notices; returns an unsubscribe. */
  subscribe(listener: NoticeListener): () => void;
}

/** Creates a {@link FeedbackBus} — one per app, module scope, shared by publishers and the rendering adapter. Apps that don't need isolation use the default {@link feedbackBus}. */
export function createFeedbackBus(): FeedbackBus {
  const listeners = new Set<NoticeListener>();
  let idSeq = 0;

  return {
    notify(notice: FeedbackNotice): string {
      const published: PublishedNotice = { ...notice, id: notice.id ?? `n_${++idSeq}` };
      for (const listener of [...listeners]) listener(published);
      return published.id;
    },

    subscribe(listener: NoticeListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The default app-wide bus — what `notify` and the adapters bind to unless handed an explicit bus. */
export const feedbackBus: FeedbackBus = createFeedbackBus();

/** Publishes a notice on the default {@link feedbackBus} — the everyday `notify({ tone: 'success', title: 'Saved' })` entry point. */
export function notify(notice: FeedbackNotice): string {
  return feedbackBus.notify(notice);
}
