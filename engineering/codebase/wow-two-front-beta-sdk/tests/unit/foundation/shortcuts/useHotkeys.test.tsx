import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHotkeys, useHotkeyMap } from '@src/foundation/shortcuts';

// Browser project (real DOM + window). Chords are parsed with `applePlatform: true` and events dispatched with
// `metaKey`, so matching is deterministic regardless of the host OS. Events are dispatched inside `act` so the
// listener (attached in an effect) is guaranteed installed first.

const APPLE = { applePlatform: true } as const;

afterEach(cleanup);

/** Dispatches a keydown on `target` (default `window`), returning the event so callers can read `defaultPrevented`. */
function press(key: string, mods: KeyboardEventInit = {}, target: EventTarget = window): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('useHotkeys', () => {
  it('fires the handler on a matching chord and prevents default', () => {
    const handler = vi.fn();
    renderHook(() => useHotkeys('mod+k', handler, APPLE));

    const event = press('k', { metaKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not prevent default when preventDefault is false', () => {
    const handler = vi.fn();
    renderHook(() => useHotkeys('mod+k', handler, { ...APPLE, preventDefault: false }));

    const event = press('k', { metaKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('treats an array of chords as an OR', () => {
    const handler = vi.fn();
    renderHook(() => useHotkeys(['mod+k', 'ctrl+k'], handler, APPLE));

    press('k', { metaKey: true });
    press('k', { ctrlKey: true });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not fire when disabled', () => {
    const handler = vi.fn();
    renderHook(() => useHotkeys('mod+k', handler, { ...APPLE, enabled: false }));

    press('k', { metaKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores a bare-key shortcut while a text input is focused, but lets mod combos through', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const bare = vi.fn();
    const combo = vi.fn();
    renderHook(() => useHotkeys('a', bare, APPLE));
    renderHook(() => useHotkeys('mod+a', combo, APPLE));

    press('a', {}, input); // typing 'a' in the field — bare shortcut suppressed
    press('a', { metaKey: true }, input); // ⌘A still fires

    expect(bare).not.toHaveBeenCalled();
    expect(combo).toHaveBeenCalledTimes(1);

    input.remove();
  });

  it('scopes to a target element when a ref is given', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const handler = vi.fn();
    renderHook(() => useHotkeys('mod+k', handler, { ...APPLE, target: { current: el } }));

    press('k', { metaKey: true }, window); // outside the scoped element
    expect(handler).not.toHaveBeenCalled();

    press('k', { metaKey: true }, el); // inside
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
  });

  it('detaches the listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useHotkeys('mod+k', handler, APPLE));

    unmount();
    press('k', { metaKey: true });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('useHotkeyMap', () => {
  it('routes each chord to its own handler', () => {
    const open = vi.fn();
    const close = vi.fn();
    renderHook(() => useHotkeyMap({ 'mod+k': open, esc: close }, APPLE));

    press('k', { metaKey: true });
    press('Escape');

    expect(open).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('skips a disabled (false) entry', () => {
    const open = vi.fn();
    renderHook(() => useHotkeyMap({ 'mod+k': false, esc: open }, APPLE));

    press('k', { metaKey: true });
    press('Escape');

    expect(open).toHaveBeenCalledTimes(1); // only esc; the false entry never binds
  });
});
