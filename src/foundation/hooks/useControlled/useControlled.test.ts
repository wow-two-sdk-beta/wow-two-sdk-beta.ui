import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useControlled } from './useControlled';

afterEach(cleanup);

interface HookProps {
  controlled?: string | undefined;
  defaultValue: string;
  onChange?: ((value: string) => void) | undefined;
}

function setup(initial: HookProps) {
  return renderHook(
    ({ controlled, defaultValue, onChange }: HookProps) =>
      useControlled<string>({ controlled, default: defaultValue, onChange }),
    { initialProps: initial },
  );
}

describe('useControlled — uncontrolled', () => {
  it('starts at the default value', () => {
    const { result } = setup({ defaultValue: 'a' });
    expect(result.current[0]).toBe('a');
  });

  it('setValue owns the state', () => {
    const { result } = setup({ defaultValue: 'a' });
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
  });

  it('setValue fires onChange with the next value', () => {
    const onChange = vi.fn();
    const { result } = setup({ defaultValue: 'a', onChange });
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('setValue without onChange does not throw', () => {
    const { result } = setup({ defaultValue: 'a' });
    expect(() => act(() => result.current[1]('b'))).not.toThrow();
    expect(result.current[0]).toBe('b');
  });

  it('default is only read on first render', () => {
    const { result, rerender } = setup({ defaultValue: 'a' });
    rerender({ defaultValue: 'z' });
    expect(result.current[0]).toBe('a');
  });
});

describe('useControlled — controlled', () => {
  it('reflects the controlled prop', () => {
    const { result } = setup({ controlled: 'c', defaultValue: 'a' });
    expect(result.current[0]).toBe('c');
  });

  it('setValue does not move the value, but still fires onChange', () => {
    const onChange = vi.fn();
    const { result } = setup({ controlled: 'c', defaultValue: 'a', onChange });
    act(() => result.current[1]('d'));
    expect(result.current[0]).toBe('c');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('d');
  });

  it('follows the controlled prop across rerenders', () => {
    const { result, rerender } = setup({ controlled: 'c', defaultValue: 'a' });
    rerender({ controlled: 'd', defaultValue: 'a' });
    expect(result.current[0]).toBe('d');
  });
});

describe('useControlled — onChange freshness', () => {
  it('uses the latest onChange, even through a setValue captured earlier (no stale closure)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = setup({ defaultValue: 'a', onChange: first });
    const setBeforeSwap = result.current[1];

    rerender({ defaultValue: 'a', onChange: second });
    act(() => setBeforeSwap('b'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('b');
  });

  it('setValue keeps a stable identity across onChange swaps', () => {
    const { result, rerender } = setup({ defaultValue: 'a', onChange: vi.fn() });
    const setValue = result.current[1];
    rerender({ defaultValue: 'a', onChange: vi.fn() });
    expect(result.current[1]).toBe(setValue);
  });
});

describe('useControlled — switching modes', () => {
  it('uncontrolled → controlled → back: internal state is preserved and never written while controlled', () => {
    const onChange = vi.fn();
    const { result, rerender } = setup({ defaultValue: 'a', onChange });

    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');

    rerender({ controlled: 'c', defaultValue: 'a', onChange });
    expect(result.current[0]).toBe('c'); // prop wins

    act(() => result.current[1]('d'));
    expect(result.current[0]).toBe('c'); // controlled: setValue is observe-only
    expect(onChange).toHaveBeenLastCalledWith('d');

    rerender({ controlled: undefined, defaultValue: 'a', onChange });
    expect(result.current[0]).toBe('b'); // internal state untouched by the controlled phase
  });
});
