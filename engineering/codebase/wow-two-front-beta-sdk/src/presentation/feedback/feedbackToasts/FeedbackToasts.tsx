import { useEffect } from 'react';

import { feedbackBus, type FeedbackBus, type PublishedNotice } from '../../../feedback';
import { Toaster, toaster, type ToasterProps, type ToastOptions } from '../toaster';

export interface FeedbackToastsProps extends ToasterProps {
  /** The bus to render. Default: the app-wide `feedbackBus` singleton (what `notify()` publishes on). */
  bus?: FeedbackBus;
}

/** Maps a bus notice onto the imperative toast payload. `NoticeTone` is a subset of the toast `Severity` vocabulary — drift here is a compile error. */
function toToastOptions(notice: PublishedNotice): ToastOptions {
  return {
    title: notice.title,
    description: notice.description,
    severity: notice.tone,
    duration: notice.durationMs,
    action: notice.action,
  };
}

/**
 * The `/feedback` bus → `Toaster` adapter: subscribes to the bus and forwards every notice into
 * the imperative `toast()` API, rendering the toast viewport itself (all `ToasterProps` pass
 * through). Mount once per app **in place of** a bare `<Toaster/>` — mounting both would render
 * every toast twice. Explicit opt-in wiring: nothing toasts until this (or another subscriber)
 * is mounted; notices published before mount are dropped, so mount it at the app root.
 */
export function FeedbackToasts({ bus = feedbackBus, ...toasterProps }: FeedbackToastsProps) {
  useEffect(() => bus.subscribe((notice) => void toaster.toast(toToastOptions(notice))), [bus]);
  return <Toaster {...toasterProps} />;
}
