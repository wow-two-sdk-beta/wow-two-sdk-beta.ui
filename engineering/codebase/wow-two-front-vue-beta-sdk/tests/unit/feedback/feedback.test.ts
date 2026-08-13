import { describe, expect, it } from 'vitest';
import { ApiError } from '@src/foundation/http';
import {
  createFeedbackBus,
  feedbackQueryErrors,
  NoticeTone,
  toErrorNotice,
  type NoticeListener,
  type PublishedNotice,
} from '@src/feedback';

/*
 * Smoke depth, `unit` project (node). The bus is the seam between "something failed" and
 * "something is on screen", so the contracts asserted are delivery, unsubscribe, and the id
 * every notice comes back with — a `notify` whose return value is not the published id leaves a
 * toast host with no handle to dismiss by.
 *
 * Every case builds its OWN bus rather than touching the module-level `feedbackBus` singleton:
 * a subscription leaked onto the shared instance would silently cross-talk into any later suite.
 */

const publishedTo = (): { received: PublishedNotice[]; listener: (n: PublishedNotice) => void } => {
  const received: PublishedNotice[] = [];
  return { received, listener: (notice) => received.push(notice) };
};

describe('createFeedbackBus', () => {
  it('delivers a notice to every subscriber', () => {
    const bus = createFeedbackBus();
    const first = publishedTo();
    const second = publishedTo();
    bus.subscribe(first.listener);
    bus.subscribe(second.listener);

    bus.notify({ tone: NoticeTone.Success, title: 'Saved' });

    expect(first.received).toHaveLength(1);
    expect(second.received).toHaveLength(1);
    expect(first.received[0]?.title).toBe('Saved');
  });

  it('returns the published id, and generates one when the caller gives none', () => {
    const bus = createFeedbackBus();
    const seen = publishedTo();
    bus.subscribe(seen.listener);

    const generated = bus.notify({ tone: NoticeTone.Info, title: 'A' });
    const explicit = bus.notify({ tone: NoticeTone.Info, title: 'B', id: 'mine' });

    expect(generated).toBeTruthy();
    expect(explicit).toBe('mine');
    expect(seen.received.map((notice) => notice.id)).toEqual([generated, 'mine']);
  });

  it('stops delivering after unsubscribe', () => {
    const bus = createFeedbackBus();
    const seen = publishedTo();
    const unsubscribe = bus.subscribe(seen.listener);

    bus.notify({ tone: NoticeTone.Info, title: 'before' });
    unsubscribe();
    bus.notify({ tone: NoticeTone.Info, title: 'after' });

    expect(seen.received.map((notice) => notice.title)).toEqual(['before']);
  });

  it('publishes to no one when nothing has subscribed', () => {
    expect(() => createFeedbackBus().notify({ tone: NoticeTone.Info, title: 'ignored' })).not.toThrow();
  });
});

/*
 * A subscriber is adapter code the publisher does not own, and `notify()` is called from click handlers
 * and `catch` blocks. So the fan-out isolates each listener: one that throws costs its own delivery and
 * nothing else — not the subscribers after it in the set, and not the caller.
 */
describe('subscriber isolation', () => {
  const boom = new Error('adapter down');

  /** Builds a listener that always throws — the broken presentation adapter. */
  const throwing = (): NoticeListener => () => {
    throw boom;
  };

  it('keeps delivering to the subscribers after one that throws', () => {
    const bus = createFeedbackBus();
    const first = publishedTo();
    const third = publishedTo();
    bus.subscribe(first.listener);
    bus.subscribe(throwing());
    bus.subscribe(third.listener);

    bus.notify({ tone: NoticeTone.Success, title: 'Saved' });

    expect(first.received.map((notice) => notice.title)).toEqual(['Saved']);
    expect(third.received.map((notice) => notice.title)).toEqual(['Saved']);
  });

  it('does not let a throwing subscriber reach the caller, and still returns the id', () => {
    const bus = createFeedbackBus();
    bus.subscribe(throwing());

    let id = '';
    expect(() => {
      id = bus.notify({ tone: NoticeTone.Danger, title: 'Failed', id: 'mine' });
    }).not.toThrow();
    expect(id).toBe('mine');
  });

  it('reports the failure to onError with the listener and the notice that was in flight', () => {
    const failures: { error: unknown; listener: unknown; title: unknown }[] = [];
    const broken = throwing();
    const bus = createFeedbackBus({
      onError: (error, context) =>
        failures.push({ error, listener: context.listener, title: context.notice.title }),
    });
    bus.subscribe(broken);

    bus.notify({ tone: NoticeTone.Info, title: 'Heads up' });

    expect(failures).toEqual([{ error: boom, listener: broken, title: 'Heads up' }]);
  });

  it('swallows the failure when no onError is supplied', () => {
    const bus = createFeedbackBus();
    bus.subscribe(throwing());

    expect(() => bus.notify({ tone: NoticeTone.Info, title: 'ignored' })).not.toThrow();
  });

  it('survives an onError that itself throws', () => {
    const bus = createFeedbackBus({
      onError: () => {
        throw new Error('handler down');
      },
    });
    const healthy = publishedTo();
    bus.subscribe(throwing());
    bus.subscribe(healthy.listener);

    expect(() => bus.notify({ tone: NoticeTone.Info, title: 'still delivered' })).not.toThrow();
    expect(healthy.received).toHaveLength(1);
  });

  it('keeps a throwing subscriber subscribed — the bus does not evict it', () => {
    const failures: unknown[] = [];
    const bus = createFeedbackBus({ onError: (error) => failures.push(error) });
    bus.subscribe(throwing());

    bus.notify({ tone: NoticeTone.Info, title: 'first' });
    bus.notify({ tone: NoticeTone.Info, title: 'second' });

    expect(failures).toHaveLength(2);
  });
});

describe('toErrorNotice', () => {
  it('titles from the problem body and describes from its detail', () => {
    const notice = toErrorNotice(new ApiError(422, { title: 'Invalid', detail: 'Name is required' }));

    expect(notice.tone).toBe(NoticeTone.Danger);
    expect(notice.title).toBe('Invalid');
    expect(notice.description).toBe('Name is required');
  });

  it('falls back to a status-shaped title when there is no problem body', () => {
    expect(toErrorNotice(new ApiError(500, null)).title).toBe('Request failed (500)');
  });

  it('names status 0 a network error rather than "Request failed (0)"', () => {
    expect(toErrorNotice(new ApiError(0, null, 'fetch failed')).title).toBe('Network error');
  });
});

describe('feedbackQueryErrors', () => {
  it('routes a coerced ApiError onto the bus it was handed', () => {
    const bus = createFeedbackBus();
    const seen = publishedTo();
    bus.subscribe(seen.listener);

    feedbackQueryErrors(bus)(new ApiError(404, { title: 'Not found' }));

    expect(seen.received).toHaveLength(1);
    expect(seen.received[0]?.tone).toBe(NoticeTone.Danger);
  });
});
