import { describe, it, expect, vi } from 'vitest';

import {
  createFeedbackBus,
  feedbackBus,
  notify,
  NoticeTone,
  type FeedbackNotice,
  type NoticeListener,
} from '@src/feedback/FeedbackBus';

const saved: FeedbackNotice = { tone: NoticeTone.Success, title: 'Saved' };

describe('createFeedbackBus', () => {
  it('notify fans out to all subscribers with an id-assigned notice', () => {
    const bus = createFeedbackBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.subscribe(first);
    bus.subscribe(second);

    const id = bus.notify(saved);

    expect(first).toHaveBeenCalledWith({ ...saved, id });
    expect(second).toHaveBeenCalledWith({ ...saved, id });
  });

  it('assigns sequential ids and returns them', () => {
    const bus = createFeedbackBus();
    expect(bus.notify(saved)).toBe('n_1');
    expect(bus.notify(saved)).toBe('n_2');
  });

  it('preserves a caller-supplied id', () => {
    const bus = createFeedbackBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    expect(bus.notify({ ...saved, id: 'upload-42' })).toBe('upload-42');
    expect(listener).toHaveBeenCalledWith({ ...saved, id: 'upload-42' });
  });

  it('unsubscribe stops delivery without touching other subscribers', () => {
    const bus = createFeedbackBus();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = bus.subscribe(first);
    bus.subscribe(second);

    bus.notify(saved);
    unsubscribeFirst();
    bus.notify(saved);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('notify is a safe no-op with no subscriber mounted', () => {
    const bus = createFeedbackBus();
    expect(() => bus.notify(saved)).not.toThrow();
  });

  it('passes the full notice payload through untouched', () => {
    const bus = createFeedbackBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    const full: FeedbackNotice = {
      tone: NoticeTone.Warning,
      title: 'Quota low',
      description: '2 of 100 remaining.',
      action: 'Upgrade',
      durationMs: Infinity,
    };
    const id = bus.notify(full);

    expect(listener).toHaveBeenCalledWith({ ...full, id });
  });

  it('separate buses are isolated from each other and from the default singleton', () => {
    const first = createFeedbackBus();
    const second = createFeedbackBus();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const singletonListener = vi.fn();
    first.subscribe(firstListener);
    second.subscribe(secondListener);
    const unsubscribe = feedbackBus.subscribe(singletonListener);

    first.notify(saved);

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).not.toHaveBeenCalled();
    expect(singletonListener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('module-level notify publishes on the default singleton', () => {
    const listener = vi.fn();
    const unsubscribe = feedbackBus.subscribe(listener);

    const id = notify(saved);

    expect(listener).toHaveBeenCalledWith({ ...saved, id });
    unsubscribe();
  });
});

/*
 * A subscriber is adapter code the publisher does not own, and `notify()` is called from click handlers
 * and `catch` blocks. So the fan-out isolates each listener: one that throws costs its own delivery and
 * nothing else — not the subscribers after it in the set, and not the caller.
 */
describe('createFeedbackBus — subscriber isolation', () => {
  const boom = new Error('adapter down');

  /** Builds a listener that always throws — the broken presentation adapter. */
  const throwingListener = (): NoticeListener =>
    vi.fn(() => {
      throw boom;
    });

  it('keeps delivering to the subscribers after one that throws', () => {
    const bus = createFeedbackBus();
    const first = vi.fn();
    const third = vi.fn();
    bus.subscribe(first);
    bus.subscribe(throwingListener());
    bus.subscribe(third);

    const id = bus.notify(saved);

    expect(first).toHaveBeenCalledWith({ ...saved, id });
    expect(third).toHaveBeenCalledWith({ ...saved, id });
  });

  it('does not let a throwing subscriber reach the caller, and still returns the id', () => {
    const bus = createFeedbackBus();
    bus.subscribe(throwingListener());

    let id = '';
    expect(() => {
      id = bus.notify({ ...saved, id: 'upload-42' });
    }).not.toThrow();
    expect(id).toBe('upload-42');
  });

  it('reports the failure to onError with the listener and the notice that was in flight', () => {
    const onError = vi.fn();
    const broken = throwingListener();
    const bus = createFeedbackBus({ onError });
    bus.subscribe(broken);

    const id = bus.notify(saved);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(boom, { listener: broken, notice: { ...saved, id } });
  });

  it('swallows the failure when no onError is supplied', () => {
    const bus = createFeedbackBus();
    bus.subscribe(throwingListener());

    expect(() => bus.notify(saved)).not.toThrow();
  });

  it('survives an onError that itself throws', () => {
    const bus = createFeedbackBus({
      onError: () => {
        throw new Error('handler down');
      },
    });
    const healthy = vi.fn();
    bus.subscribe(throwingListener());
    bus.subscribe(healthy);

    expect(() => bus.notify(saved)).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
  });

  it('keeps a throwing subscriber subscribed — the bus does not evict it', () => {
    const onError = vi.fn();
    const bus = createFeedbackBus({ onError });
    bus.subscribe(throwingListener());

    bus.notify(saved);
    bus.notify(saved);

    expect(onError).toHaveBeenCalledTimes(2);
  });
});
