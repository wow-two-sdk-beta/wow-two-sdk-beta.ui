import type { SyntheticEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { composeEventHandlers } from './composeEventHandlers';

interface EventStub {
  defaultPrevented: boolean;
  preventDefault(): void;
}

function createEvent(defaultPrevented = false): SyntheticEvent {
  const stub: EventStub = {
    defaultPrevented,
    preventDefault() {
      stub.defaultPrevented = true;
    },
  };
  return stub as unknown as SyntheticEvent;
}

describe('composeEventHandlers', () => {
  it('runs their handler first, then ours, with the same event', () => {
    const order: string[] = [];
    const theirs = vi.fn(() => {
      order.push('theirs');
    });
    const ours = vi.fn(() => {
      order.push('ours');
    });
    const event = createEvent();

    composeEventHandlers(theirs, ours)(event);

    expect(order).toEqual(['theirs', 'ours']);
    expect(theirs).toHaveBeenCalledWith(event);
    expect(ours).toHaveBeenCalledWith(event);
  });

  it('runs ours when theirs is undefined', () => {
    const ours = vi.fn();
    const event = createEvent();

    composeEventHandlers(undefined, ours)(event);

    expect(ours).toHaveBeenCalledTimes(1);
    expect(ours).toHaveBeenCalledWith(event);
  });

  it('skips ours when theirs calls preventDefault()', () => {
    const ours = vi.fn();

    composeEventHandlers((event) => event.preventDefault(), ours)(createEvent());

    expect(ours).not.toHaveBeenCalled();
  });

  it('skips ours when the event arrives already default-prevented', () => {
    const theirs = vi.fn();
    const ours = vi.fn();

    composeEventHandlers(theirs, ours)(createEvent(true));

    expect(theirs).toHaveBeenCalledTimes(1); // theirs always runs
    expect(ours).not.toHaveBeenCalled();
  });

  it('checkForDefaultPrevented: false runs ours despite preventDefault()', () => {
    const ours = vi.fn();
    const event = createEvent();

    composeEventHandlers((e) => e.preventDefault(), ours, { checkForDefaultPrevented: false })(
      event,
    );

    expect(ours).toHaveBeenCalledTimes(1);
    expect(ours).toHaveBeenCalledWith(event);
  });
});
