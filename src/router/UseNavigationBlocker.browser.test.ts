import { cleanup, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBlocker, type Blocker } from 'react-router-dom';

import { useNavigationBlocker } from './UseNavigationBlocker';

// Mock the router so the hook needs no live router context; assert wiring to `useBlocker`.
vi.mock('react-router-dom', () => ({ useBlocker: vi.fn() }));

const mockUseBlocker = vi.mocked(useBlocker);

const idleBlocker = { state: 'unblocked', proceed: undefined, reset: undefined } as unknown as Blocker;

/** Finds the handler passed to a window event-listener spy for the given event. */
function listenerFor(
  spy: ReturnType<typeof vi.spyOn>,
  event: string,
): EventListener | undefined {
  const call = (spy.mock.calls as unknown[][]).find((args) => args[0] === event);
  return call?.[1] as EventListener | undefined;
}

describe('useNavigationBlocker', () => {
  beforeEach(() => {
    mockUseBlocker.mockReset();
    mockUseBlocker.mockReturnValue(idleBlocker);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('passes shouldBlock through to useBlocker and returns its blocker', () => {
    const { result } = renderHook(({ block }) => useNavigationBlocker(block), {
      initialProps: { block: true },
    });

    expect(mockUseBlocker).toHaveBeenCalledWith(true);
    expect(result.current).toBe(idleBlocker);
  });

  it('registers a beforeunload handler while blocking', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useNavigationBlocker(true));

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does not register beforeunload when not blocking', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useNavigationBlocker(false));

    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('removes the handler when shouldBlock flips false', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { rerender } = renderHook(({ block }) => useNavigationBlocker(block), {
      initialProps: { block: true },
    });

    expect(removeSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender({ block: false });

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('removes the handler on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNavigationBlocker(true));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('the beforeunload handler prevents default and returns a truthy string', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useNavigationBlocker(true));

    const handler = listenerFor(addSpy, 'beforeunload');
    expect(handler).toBeDefined();

    const event = { preventDefault: vi.fn(), returnValue: '' } as unknown as BeforeUnloadEvent;
    const returned = handler!(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.returnValue).toBeTruthy();
    expect(typeof returned).toBe('string');
    expect(returned).toBeTruthy();
  });
});
