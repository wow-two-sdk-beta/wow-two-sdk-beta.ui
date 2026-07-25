import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';

import {
  useInView,
  useIntersectionObserver,
  useMutationObserver,
  useVisibility,
} from '@src/foundation/observers';

// Browser project (real chromium ⇒ a real layout engine and a REAL `IntersectionObserver` / `MutationObserver`,
// not a stub). That is the whole point of testing this slice here: a hand-rolled observer mock would only prove
// the hook calls the methods the mock defines, while every bug worth catching lives in the parts a mock cannot
// have — when the browser actually decides an element crossed a threshold, and the fact that it decides so
// ASYNCHRONOUSLY.
//
// NOTHING IS ASSERTED SYNCHRONOUSLY AFTER MOUNT. A real `IntersectionObserver` delivers its first entry a frame
// or so after `observe()`, so `expect(result.current.inView)` immediately after `renderHook` reads the initial
// state every time and would pass for a hook that never observed anything at all. Every positive assertion goes
// through `waitFor` (RTL's, which is `act`-aware — state here lands from a browser callback, outside React's
// event loop), and every NEGATIVE one is preceded by `settle()` so it has a real chance to fail.
//
// GEOMETRY IS EXPLICIT AND THE ROOT IS ALWAYS A CONTAINER, never the viewport: a headless viewport's size is a
// property of the runner, so a test that scrolls the page would be a test of the runner's window. A fixed-size
// `overflow:auto` div with a spacer makes "out of view" and "in view" exact, computable positions.

/** Waits past a few frames so a negative assertion (`never fired`) can actually fail. */
function settle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 80);
  });
}

const mounted: HTMLElement[] = [];

/** Appends to the document and tracks the node for teardown. */
function mount<T extends HTMLElement>(element: T): T {
  document.body.appendChild(element);
  mounted.push(element);
  return element;
}

/** A fixed-size scroll container used as the observer root. */
function scrollRoot(height = 100): HTMLDivElement {
  const root = document.createElement('div');
  root.style.cssText = `position:absolute;top:0;left:0;width:200px;height:${height}px;overflow-y:auto;padding:0;border:0;box-sizing:border-box;`;
  return mount(root);
}

/** A block of fixed height appended into `parent`. */
function block(parent: HTMLElement, height: number): HTMLDivElement {
  const element = document.createElement('div');
  element.style.cssText = `height:${height}px;width:100px;flex:none;`;
  parent.appendChild(element);
  return element;
}

/**
 * Root (100px tall) holding a 400px spacer then the target — so the target starts fully OUT of view and
 * `scrollTop = 400` brings it fully in.
 */
function outOfViewHarness(): { root: HTMLDivElement; target: HTMLDivElement } {
  const root = scrollRoot();
  block(root, 400);
  const target = block(root, 100);
  return { root, target };
}

afterEach(() => {
  cleanup();
  for (const element of mounted.splice(0)) element.remove();
});

describe('useInView', () => {
  it('reports false for an element below the fold, then true once it is scrolled into view', async () => {
    const { root, target } = outOfViewHarness();
    const ref: RefObject<HTMLDivElement | null> = { current: target };

    const { result } = renderHook(() => useInView(ref, { root }));

    // Wait for the observer's OWN first entry — the initial `false` is the pre-observation state and proves
    // nothing on its own.
    await waitFor(() => {
      expect(result.current.entry).not.toBeNull();
    });
    expect(result.current.inView).toBe(false);

    root.scrollTop = 400;

    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
    expect(result.current.entry?.target).toBe(target);
  });

  it('with `once`, never reports again after the first intersection', async () => {
    const { root, target } = outOfViewHarness();
    const ref: RefObject<HTMLDivElement | null> = { current: target };

    const { result } = renderHook(() => useInView(ref, { root, once: true }));

    root.scrollTop = 400;
    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
    const settledEntry = result.current.entry;

    root.scrollTop = 0; // scroll it back out — a live observer would fire and flip this to false
    await settle();

    expect(result.current.inView).toBe(true);
    expect(result.current.entry).toBe(settledEntry); // identical object ⇒ no further callback arrived
  });

  it('observes the new node when the ref is repointed between renders', async () => {
    const root = scrollRoot();
    const visible = block(root, 100); // occupies the whole root — in view at rest
    block(root, 400); // spacer
    const hidden = block(root, 100); // far below the fold

    const ref: RefObject<HTMLDivElement | null> = { current: hidden };
    const { result, rerender } = renderHook(() => useInView(ref, { root }));

    await waitFor(() => {
      expect(result.current.entry).not.toBeNull();
    });
    expect(result.current.inView).toBe(false);

    ref.current = visible; // a ref mutation does NOT re-render — the hook has to notice on its own
    rerender();

    await waitFor(() => {
      expect(result.current.inView).toBe(true);
    });
    // The decisive assertion: the entry belongs to the NEW element, so the old one was dropped and this is not
    // a stale `true` from the node observed before.
    expect(result.current.entry?.target).toBe(visible);
  });

  it('disconnects its observer on unmount', async () => {
    const { root, target } = outOfViewHarness();
    const ref: RefObject<HTMLDivElement | null> = { current: target };
    const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    try {
      const { result, unmount } = renderHook(() => useInView(ref, { root }));
      await waitFor(() => {
        expect(result.current.entry).not.toBeNull();
      });

      const before = disconnect.mock.calls.length;
      unmount();

      expect(disconnect.mock.calls.length).toBeGreaterThan(before);
    } finally {
      disconnect.mockRestore();
    }
  });

  it('never observes while `disabled`', async () => {
    const { root, target } = outOfViewHarness();
    const ref: RefObject<HTMLDivElement | null> = { current: target };

    const { result } = renderHook(() => useInView(ref, { root, disabled: true }));

    root.scrollTop = 400; // fully in view, but nothing is watching
    await settle();

    expect(result.current.inView).toBe(false);
    expect(result.current.entry).toBeNull();
  });
});

describe('useVisibility', () => {
  it('reports a fractional ratio for a partly visible element and 1 once it fits', async () => {
    const root = scrollRoot(100);
    block(root, 50); // pushes the target half out of the 100px root
    const target = block(root, 100);
    const ref: RefObject<HTMLDivElement | null> = { current: target };

    const { result } = renderHook(() => useVisibility(ref, { root, steps: 20 }));

    // 50 of the target's 100px sit inside the root ⇒ ~0.5, quantized to the 5% ladder.
    await waitFor(() => {
      expect(result.current.ratio).toBeGreaterThan(0.3);
    });
    expect(result.current.ratio).toBeLessThan(0.7);
    expect(result.current.inView).toBe(true);

    root.scrollTop = 50; // target now exactly fills the root

    await waitFor(() => {
      expect(result.current.ratio).toBeGreaterThan(0.95);
    });
  });

  it('reports ratio 0 while the element is out of view', async () => {
    const { root, target } = outOfViewHarness();
    const ref: RefObject<HTMLDivElement | null> = { current: target };

    const { result } = renderHook(() => useVisibility(ref, { root }));

    await waitFor(() => {
      expect(result.current.entry).not.toBeNull();
    });
    expect(result.current.ratio).toBe(0);
    expect(result.current.inView).toBe(false);
  });
});

describe('useIntersectionObserver', () => {
  /**
   * Swaps in a counting constructor that still builds a REAL observer, so the hook's behaviour is unchanged and
   * only the construction count is under test.
   *
   * Deliberately a `function` expression, not an arrow: arrows have no `[[Construct]]` slot, so `new` on one
   * throws `is not a constructor`. A normal function that RETURNS an object hands that object back from `new`,
   * which is what makes the real observer come out the other side.
   */
  function spyConstructor() {
    const Real = window.IntersectionObserver;
    const ctor = vi.fn(function (
      callback: IntersectionObserverCallback,
      init?: IntersectionObserverInit,
    ): IntersectionObserver {
      return new Real(callback, init);
    });
    window.IntersectionObserver = ctor as unknown as typeof IntersectionObserver;
    return {
      ctor,
      restore: (): void => {
        window.IntersectionObserver = Real;
      },
    };
  }

  it('shares ONE observer across every target', async () => {
    const root = scrollRoot(300);
    const targets = [block(root, 50), block(root, 50), block(root, 50)];
    const refs: RefObject<Element | null>[] = targets.map((target) => ({ current: target }));
    const callback = vi.fn<(entry: IntersectionObserverEntry) => void>();

    const { ctor, restore } = spyConstructor();
    try {
      renderHook(() => useIntersectionObserver(refs, callback, { root }));

      // All three are inside the 300px root, so all three report.
      await waitFor(() => {
        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(3);
      });

      // The whole reason this hook exists instead of `useInView` per row.
      expect(ctor).toHaveBeenCalledTimes(1);

      const reported = new Set(callback.mock.calls.map((call) => call[0].target));
      expect(reported.size).toBe(3);
    } finally {
      restore();
    }
  });

  it('observes a target added later without constructing a second observer', async () => {
    const root = scrollRoot(300);
    const first = block(root, 50);
    const second = block(root, 50);

    const refs: RefObject<Element | null>[] = [{ current: first }];
    const callback = vi.fn<(entry: IntersectionObserverEntry) => void>();

    const { ctor, restore } = spyConstructor();
    try {
      const { rerender } = renderHook(() => useIntersectionObserver(refs, callback, { root }));
      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });

      refs.push({ current: second });
      rerender();

      await waitFor(() => {
        const seen = new Set(callback.mock.calls.map((call) => call[0].target));
        expect(seen.has(second)).toBe(true);
      });
      expect(ctor).toHaveBeenCalledTimes(1); // diffed, not rebuilt
    } finally {
      restore();
    }
  });

  it('disconnects on unmount', async () => {
    const root = scrollRoot(300);
    const refs: RefObject<Element | null>[] = [{ current: block(root, 50) }];
    const callback = vi.fn<(entry: IntersectionObserverEntry) => void>();
    const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');

    try {
      const { unmount } = renderHook(() => useIntersectionObserver(refs, callback, { root }));
      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });

      const before = disconnect.mock.calls.length;
      unmount();

      expect(disconnect.mock.calls.length).toBeGreaterThan(before);
    } finally {
      disconnect.mockRestore();
    }
  });
});

describe('useMutationObserver', () => {
  it('fires on a childList change and stops after unmount', async () => {
    const host = mount(document.createElement('div'));
    const ref: RefObject<HTMLDivElement | null> = { current: host };
    const callback = vi.fn<(records: readonly MutationRecord[], observer: MutationObserver) => void>();

    const { unmount } = renderHook(() => useMutationObserver(ref, callback));

    host.appendChild(document.createElement('span'));

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    const records = callback.mock.calls.at(0)?.[0];
    expect(records?.at(0)?.type).toBe('childList');
    expect(records?.at(0)?.addedNodes.length).toBe(1);

    unmount();
    callback.mockClear();

    host.appendChild(document.createElement('span'));
    await settle();

    expect(callback).not.toHaveBeenCalled();
  });

  it('watches attributes when asked, filtered to the named ones', async () => {
    const host = mount(document.createElement('div'));
    const ref: RefObject<HTMLDivElement | null> = { current: host };
    const callback = vi.fn<(records: readonly MutationRecord[], observer: MutationObserver) => void>();

    renderHook(() => useMutationObserver(ref, callback, { attributeFilter: ['data-state'] }));

    host.setAttribute('data-ignored', 'x'); // outside the filter — must not report
    host.setAttribute('data-state', 'open');

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    const names = callback.mock.calls.flatMap((call) => call[0].map((record) => record.attributeName));
    expect(names).toContain('data-state');
    expect(names).not.toContain('data-ignored');
  });

  it('does not throw on an options object that requests no mutation kind', async () => {
    const host = mount(document.createElement('div'));
    const ref: RefObject<HTMLDivElement | null> = { current: host };
    const callback = vi.fn<(records: readonly MutationRecord[], observer: MutationObserver) => void>();

    // `{ subtree: true }` alone is a `TypeError` from the raw API; the slice falls back to childList.
    renderHook(() => useMutationObserver(ref, callback, { subtree: true }));

    host.appendChild(document.createElement('span'));

    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
  });

  it('re-subscribes when the ref is repointed between renders', async () => {
    const first = mount(document.createElement('div'));
    const second = mount(document.createElement('div'));
    const ref: RefObject<HTMLDivElement | null> = { current: first };
    const callback = vi.fn<(records: readonly MutationRecord[], observer: MutationObserver) => void>();

    const { rerender } = renderHook(() => useMutationObserver(ref, callback));

    ref.current = second;
    rerender();

    first.appendChild(document.createElement('span')); // old target — no longer watched
    await settle();
    expect(callback).not.toHaveBeenCalled();

    second.appendChild(document.createElement('span'));
    await waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
  });
});
