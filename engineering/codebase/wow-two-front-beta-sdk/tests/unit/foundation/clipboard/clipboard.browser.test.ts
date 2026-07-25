import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { RefObject } from 'react';

import { usePasteHandler, useClipboardCopy, type PasteItems } from '@src/foundation/clipboard';

// Browser project — both hooks need a real renderer, and `usePasteHandler` additionally needs a real
// `EventTarget`, a real `ClipboardEvent` constructor, and a real `DataTransfer`. Node has none of those, and a
// hand-built stand-in would only prove the hook calls the members the stand-in implements; the behaviours worth
// testing here are precisely the ones a stand-in gets wrong — that a listener genuinely detaches, and that a
// real paste event's `DataTransfer` parses.
//
// `navigator.clipboard` IS stubbed even here. Headless chromium has the real API, but a real write needs a
// permission grant and a user gesture the test harness has neither of — so the assertions would be about
// Playwright's permission state rather than about the hook. An own property on `navigator` shadows the
// prototype's accessor; `afterEach` deletes it, which restores the real one.

/** Installs a fake `navigator.clipboard` for one test, shadowing the real accessor. */
function installClipboard(clipboard: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true, writable: true });
}

/** A `writeText` that records its calls; pass a rejection to make every write fail. */
function recordingClipboard(reject?: unknown): { writes: string[]; clipboard: unknown } {
  const writes: string[] = [];
  return {
    writes,
    clipboard: {
      writeText: (text: string) => {
        writes.push(text);
        return reject === undefined ? Promise.resolve() : Promise.reject(reject);
      },
    },
  };
}

/** Builds a real `paste` event carrying a real `DataTransfer`. */
function pasteEvent(fill: (data: DataTransfer) => void): ClipboardEvent {
  const data = new DataTransfer();
  fill(data);
  return new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
}

/** Appends a detached-from-nothing element the test can dispatch at, cleaned up with the body. */
function mountElement(): HTMLDivElement {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
}

const spies: MockInstance[] = [];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  for (const spy of spies.splice(0)) spy.mockRestore();
  delete (navigator as { clipboard?: unknown }).clipboard;
  document.body.replaceChildren();
});

describe('useClipboardCopy', () => {
  it('starts idle', () => {
    installClipboard(recordingClipboard().clipboard);
    const { result } = renderHook(() => useClipboardCopy());

    expect(result.current.status).toBe('idle');
  });

  it('transitions to copied AND resolves the full result — the caller can branch, not just render', async () => {
    const clip = recordingClipboard();
    installClipboard(clip.clipboard);
    const { result } = renderHook(() => useClipboardCopy());

    // The returned result is the difference from `foundation/hooks`' `useClipboard`, whose `copy` resolves
    // `void` on both success and failure and leaves the outcome legible only to a component.
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.copy('https://example.com');
    });

    expect(outcome).toEqual({ status: 'copied' });
    expect(result.current.status).toBe('copied');
    expect(clip.writes).toEqual(['https://example.com']);
  });

  it('surfaces denied on status AND in the resolved result', async () => {
    const refusal = new DOMException('Write permission denied.', 'NotAllowedError');
    installClipboard(recordingClipboard(refusal).clipboard);
    const { result } = renderHook(() => useClipboardCopy());

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.copy('x');
    });

    expect(outcome).toEqual({ status: 'denied', error: refusal });
    expect(result.current.status).toBe('denied');
  });

  it('returns to idle after resetAfterMs', async () => {
    vi.useFakeTimers();
    installClipboard(recordingClipboard().clipboard);
    const { result } = renderHook(() => useClipboardCopy({ resetAfterMs: 1500 }));

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.status).toBe('copied');

    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(result.current.status).toBe('copied');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe('idle');
  });

  it('holds the status indefinitely with resetAfterMs: 0', async () => {
    vi.useFakeTimers();
    installClipboard(recordingClipboard().clipboard);
    const { result } = renderHook(() => useClipboardCopy({ resetAfterMs: 0 }));

    await act(async () => {
      await result.current.copy('x');
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.status).toBe('copied');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reset() clears the status immediately and cancels the pending auto-reset', async () => {
    vi.useFakeTimers();
    installClipboard(recordingClipboard().clipboard);
    const { result } = renderHook(() => useClipboardCopy());

    await act(async () => {
      await result.current.copy('x');
    });
    expect(result.current.status).toBe('copied');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('CLEARS THE PENDING TIMER ON UNMOUNT', async () => {
    vi.useFakeTimers();
    installClipboard(recordingClipboard().clipboard);
    const { result, unmount } = renderHook(() => useClipboardCopy({ resetAfterMs: 5000 }));

    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      await result.current.copy('x');
    });

    // The auto-reset is armed...
    expect(result.current.status).toBe('copied');
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    // ...and unmounting disarms it, rather than leaving a timeout to fire into a dead component.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not arm a timer when the copy resolves after unmount', async () => {
    vi.useFakeTimers();
    let release: (() => void) | undefined;
    installClipboard({
      writeText: () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    });

    const { result, unmount } = renderHook(() => useClipboardCopy());

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = result.current.copy('x');
    });

    unmount();
    release?.();

    // The result still reaches the caller — it answers their call, it is not this component's state.
    await expect(pending).resolves.toEqual({ status: 'copied' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports failures through onError once per copy', async () => {
    const onError = vi.fn();
    const boom = new Error('boom');
    installClipboard(recordingClipboard(boom).clipboard);
    const { result } = renderHook(() => useClipboardCopy({ onError }));

    await act(async () => {
      await result.current.copy('x');
    });

    expect(onError).toHaveBeenCalledExactlyOnceWith(boom);
    expect(result.current.status).toBe('failed');
  });

  it('keeps copy stable across renders', () => {
    installClipboard(recordingClipboard().clipboard);
    const { result, rerender } = renderHook(() => useClipboardCopy({ onError: () => undefined }));

    const first = result.current.copy;
    rerender();

    expect(result.current.copy).toBe(first);
  });
});

describe('usePasteHandler', () => {
  it('fires on a paste dispatched at window, with the payload already extracted', () => {
    const handler = vi.fn();
    renderHook(() => {
      usePasteHandler(handler);
    });

    act(() => {
      window.dispatchEvent(
        pasteEvent((data) => {
          data.setData('text/plain', 'pasted text');
          data.setData('text/html', '<b>pasted</b>');
        }),
      );
    });

    expect(handler).toHaveBeenCalledOnce();
    const items = handler.mock.calls.at(0)?.at(0) as PasteItems | undefined;
    expect(items?.text).toBe('pasted text');
    expect(items?.html).toBe('<b>pasted</b>');
    expect(items?.files).toEqual([]);
  });

  it('extracts a pasted file', () => {
    const handler = vi.fn();
    renderHook(() => {
      usePasteHandler(handler);
    });

    act(() => {
      window.dispatchEvent(
        pasteEvent((data) => {
          data.items.add(new File(['x'], 'screenshot.png', { type: 'image/png' }));
        }),
      );
    });

    const items = handler.mock.calls.at(0)?.at(0) as PasteItems | undefined;
    expect(items?.files).toHaveLength(1);
    expect(items?.files.at(0)?.name).toBe('screenshot.png');
  });

  it('DETACHES ON UNMOUNT', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => {
      usePasteHandler(handler);
    });

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'first')));
    });
    expect(handler).toHaveBeenCalledOnce();

    unmount();

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'second')));
    });

    // Still one — the listener is gone, not merely inert.
    expect(handler).toHaveBeenCalledOnce();
  });

  it('scopes the listener to a target ref', () => {
    const handler = vi.fn();
    const target = mountElement();
    const other = mountElement();
    const ref: RefObject<HTMLElement | null> = { current: target };

    renderHook(() => {
      usePasteHandler(handler, { target: ref });
    });

    act(() => {
      other.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'elsewhere')));
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      target.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'in scope')));
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('binds nothing while enabled is false, and binds when it flips true', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => { usePasteHandler(handler, { enabled }); }, {
      initialProps: { enabled: false },
    });

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'ignored')));
    });
    expect(handler).not.toHaveBeenCalled();

    rerender({ enabled: true });

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'heard')));
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('leaves the default paste alone unless preventDefault is asked for', () => {
    renderHook(() => {
      usePasteHandler(() => undefined);
    });

    const event = pasteEvent((data) => data.setData('text/plain', 'x'));
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(false);
  });

  it('suppresses the default paste on preventDefault: true', () => {
    renderHook(() => {
      usePasteHandler(() => undefined, { preventDefault: true });
    });

    const event = pasteEvent((data) => data.setData('text/plain', 'x'));
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
  });

  it('absorbs a throw from the handler and keeps listening', () => {
    const handler = vi.fn(() => {
      throw new Error('consumer exploded');
    });
    renderHook(() => {
      usePasteHandler(handler);
    });

    expect(() => {
      act(() => {
        window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'first')));
      });
    }).not.toThrow();

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'second')));
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not re-bind the listener when only the handler identity changes', () => {
    const add = vi.spyOn(window, 'addEventListener');
    spies.push(add);

    const { rerender } = renderHook(() => {
      usePasteHandler(() => undefined);
    });
    const afterFirst = add.mock.calls.filter(([type]) => type === 'paste').length;

    rerender();
    rerender();

    expect(add.mock.calls.filter(([type]) => type === 'paste')).toHaveLength(afterFirst);
  });

  it('routes the latest handler without re-binding', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(({ handler }: { handler: () => void }) => { usePasteHandler(handler); }, {
      initialProps: { handler: first },
    });

    rerender({ handler: second });

    act(() => {
      window.dispatchEvent(pasteEvent((data) => data.setData('text/plain', 'x')));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
