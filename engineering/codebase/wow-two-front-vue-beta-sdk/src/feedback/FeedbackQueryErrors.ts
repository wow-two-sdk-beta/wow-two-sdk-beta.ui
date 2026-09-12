import type { AppError } from '../foundation/results';
import { feedbackBus, NoticeTone, type FeedbackBus, type FeedbackNotice } from './FeedbackBus';

/** Maps the catalog's display-safe message without exposing raw exception or server diagnostics. */
export function toErrorNotice(error: AppError): FeedbackNotice {
  return { tone: NoticeTone.Danger, title: error.message };
}

/** Creates the explicit query failure-to-notice adapter; cancellation stays quiet. */
export function feedbackQueryErrors(bus: FeedbackBus = feedbackBus): (error: AppError) => void {
  return (error) => {
    if (error.type !== 'cancelled') bus.notify(toErrorNotice(error));
  };
}
