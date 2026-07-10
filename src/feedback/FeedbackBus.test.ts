import { describe, it, expect, vi } from 'vitest';

import { createFeedbackBus, feedbackBus, notify, NoticeTone, type FeedbackNotice } from './FeedbackBus';

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
