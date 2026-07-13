import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAutosave } from '@src/foundation/hooks/useAutosave/useAutosave';

// Browser project (real DOM). Timers are faked per-test so the debounce window can be advanced deterministically;
// async-save cases additionally flush the microtask queue (`await Promise.resolve()`) so a resolved `save`'s
// `.then` runs inside `act`.

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('useAutosave', () => {
  it('does not save the initial value on mount', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    renderHook(() => useAutosave('initial', save, { delayMs: 100 }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('saves the latest value after the debounce window (sync)', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 500 }), {
      initialProps: { v: 'a' },
    });

    act(() => rerender({ v: 'b' }));
    expect(result.current.status).toBe('pending');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('b');
    expect(result.current.status).toBe('saved');
  });

  it('collapses rapid changes into one save with the last value', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 500 }), { initialProps: { v: '' } });

    act(() => rerender({ v: 'a' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => rerender({ v: 'ab' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => rerender({ v: 'abc' }));
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('abc');
  });

  it('flush() saves immediately, bypassing the remaining delay', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 5000 }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'x' }));
    act(() => {
      result.current.flush();
    });

    expect(save).toHaveBeenCalledWith('x');
    expect(result.current.status).toBe('saved');
  });

  it('flush() is a no-op when nothing is pending', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { result } = renderHook(() => useAutosave('a', save, { delayMs: 500 }));
    act(() => {
      result.current.flush();
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('cancel() drops a pending save', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 500 }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'x' }));
    act(() => {
      result.current.cancel();
    });
    expect(result.current.status).toBe('idle');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('does not save while disabled, and resumes when re-enabled', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { rerender } = renderHook(({ v, enabled }) => useAutosave(v, save, { delayMs: 500, enabled }), {
      initialProps: { v: 'a', enabled: false },
    });

    act(() => rerender({ v: 'b', enabled: false }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(save).not.toHaveBeenCalled();

    act(() => rerender({ v: 'c', enabled: true }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('c');
  });

  it('drives status saving -> saved for an async save and records lastSavedAt', async () => {
    vi.useFakeTimers();
    const save = vi.fn(() => Promise.resolve());
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 300 }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'x' }));
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledWith('x');
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it('sets error status and calls onError when an async save rejects', async () => {
    vi.useFakeTimers();
    const error = new Error('nope');
    const save = vi.fn(() => Promise.reject(error));
    const onError = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 300, onError }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'x' }));
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.status).toBe('error');
  });

  it('sets error status when a sync save throws', () => {
    vi.useFakeTimers();
    const save = vi.fn(() => {
      throw new Error('boom');
    });
    const onError = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 100, onError }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'x' }));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onError).toHaveBeenCalled();
    expect(result.current.status).toBe('error');
  });

  it('flushes a pending save on unmount so a mid-edit change is not lost', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { rerender, unmount } = renderHook(({ v }) => useAutosave(v, save, { delayMs: 5000 }), {
      initialProps: { v: '' },
    });

    act(() => rerender({ v: 'draft' }));
    act(() => {
      unmount();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('draft');
  });

  it('does not flush on unmount when no save is pending', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const { unmount } = renderHook(() => useAutosave('a', save, { delayMs: 500 }));
    act(() => {
      unmount();
    });
    expect(save).not.toHaveBeenCalled();
  });
});
