import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useDisclosure } from './useDisclosure';

afterEach(cleanup);

describe('useDisclosure', () => {
  it('starts closed by default', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it('honors the initial argument', () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('open() opens and is idempotent', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it('close() closes and is idempotent', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('toggle() flips the state on each call', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it('setOpen() sets the state explicitly in both directions', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.setOpen(true));
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.setOpen(false));
    expect(result.current.isOpen).toBe(false);
  });

  it('callbacks keep a stable identity across state changes', () => {
    const { result } = renderHook(() => useDisclosure());
    const { open, close, toggle, setOpen } = result.current;

    act(() => result.current.toggle());

    expect(result.current.open).toBe(open);
    expect(result.current.close).toBe(close);
    expect(result.current.toggle).toBe(toggle);
    expect(result.current.setOpen).toBe(setOpen);
  });

  it('initial argument changes after mount are ignored', () => {
    const { result, rerender } = renderHook(
      ({ initial }: { initial: boolean }) => useDisclosure(initial),
      { initialProps: { initial: false } },
    );
    rerender({ initial: true });
    expect(result.current.isOpen).toBe(false);
  });
});
