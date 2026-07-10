import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';

import { createFeedbackBus, feedbackBus, NoticeTone, type PublishedNotice } from './FeedbackBus';
import { feedbackQueryErrors, toErrorNotice } from './FeedbackQueryErrors';

describe('toErrorNotice', () => {
  it('maps a problem-details error to a danger notice with title + detail', () => {
    const notice = toErrorNotice(
      new ApiError(409, { title: 'Slug already taken', detail: 'Pick a different short code.' }),
    );

    expect(notice).toEqual({
      tone: NoticeTone.Danger,
      title: 'Slug already taken',
      description: 'Pick a different short code.',
    });
  });

  it('omits the description when the problem body has no detail', () => {
    const notice = toErrorNotice(new ApiError(403, { title: 'Forbidden' }));

    expect(notice.title).toBe('Forbidden');
    expect(notice.description).toBeUndefined();
  });

  it('falls back to a status-shaped title when the problem body is missing', () => {
    const notice = toErrorNotice(new ApiError(503, null));

    expect(notice.tone).toBe(NoticeTone.Danger);
    expect(notice.title).toBe('Request failed (503)');
    // The default constructor message just restates the status — not worth a description line.
    expect(notice.description).toBeUndefined();
  });

  it('titles network failures (status 0) and surfaces the wrapped transport message', () => {
    // Shape produced by `toApiError(new TypeError('fetch failed'))` in `/query`.
    const notice = toErrorNotice(new ApiError(0, null, 'fetch failed'));

    expect(notice.title).toBe('Network error');
    expect(notice.description).toBe('fetch failed');
  });
});

describe('feedbackQueryErrors', () => {
  it('produces an onError callback that publishes the mapped notice on the given bus', () => {
    const bus = createFeedbackBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    const onError = feedbackQueryErrors(bus);
    onError(new ApiError(422, { title: 'Validation failed', detail: 'Name is required.' }));

    expect(listener).toHaveBeenCalledTimes(1);
    const notice = listener.mock.calls[0]![0] as PublishedNotice;
    expect(notice.tone).toBe(NoticeTone.Danger);
    expect(notice.title).toBe('Validation failed');
    expect(notice.description).toBe('Name is required.');
    expect(notice.id).toBeTruthy();
  });

  it('defaults to the app-wide singleton bus when none is given', () => {
    const listener = vi.fn();
    const unsubscribe = feedbackBus.subscribe(listener);

    feedbackQueryErrors()(new ApiError(500, { title: 'Server error' }));

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
