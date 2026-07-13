import type { ApiError } from '../foundation/http';

import { feedbackBus, NoticeTone, type FeedbackBus, type FeedbackNotice } from './FeedbackBus';

/**
 * Maps a coerced `ApiError` onto a danger notice — title from the problem body (`problem.title`,
 * else a status-shaped fallback), description from `problem.detail`. Network failures (status `0`)
 * title as "Network error" and surface the wrapped transport message as the description. Exported
 * for apps composing their own error callback on top of the house mapping.
 */
export function toErrorNotice(error: ApiError): FeedbackNotice {
  const isNetwork = error.status === 0;
  const title = error.problem?.title ?? (isNetwork ? 'Network error' : `Request failed (${error.status})`);
  const description = error.problem?.detail ?? (isNetwork && error.message !== title ? error.message : undefined);

  return { tone: NoticeTone.Danger, title, description };
}

/**
 * Produces the `/query` global error callback — plug into the existing seam:
 * `createQueryClient({ onError: feedbackQueryErrors() })`. Lives here (not in `/query`) so the
 * query module keeps its RQ-optional isolation and never depends on the bus; the callback shape
 * (`(error: ApiError) => void`) also fits a hand-rolled `QueryCache`/`MutationCache` `onError`
 * after `toApiError` coercion. Explicit opt-in wiring — nothing toasts until an app passes this.
 */
export function feedbackQueryErrors(bus: FeedbackBus = feedbackBus): (error: ApiError) => void {
  return (error) => void bus.notify(toErrorNotice(error));
}
