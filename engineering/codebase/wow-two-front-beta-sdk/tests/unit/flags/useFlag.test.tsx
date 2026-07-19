// The React seam's contract is re-evaluation: a flag read must follow the evaluation context, whether
// the context moves imperatively (`client.setContext` from a sign-in handler) or arrives as a prop.
// The last case also pins the no-op-merge guard — a context literal rebuilt on every parent render
// must not re-notify the provider.
import '@testing-library/jest-dom/vitest';
import { cleanup, render, renderHook, screen, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';

import { createFlagClient, staticFlagProvider, FlagReason, FlagsProvider, useFlag, useFlags } from '@src/flags';

afterEach(cleanup);

/** A flag map with a targeted string flag, a boolean and an object flag. */
const flags = staticFlagProvider({
  theme: { value: 'light', variant: 'control', rules: [{ when: { plan: 'pro' }, value: 'dark', variant: 'treatment' }] },
  newNav: true,
  limits: { value: { max: 25 } },
});

/** Wraps a hook in a provider bound to `client`. */
function wrapperFor(client: ReturnType<typeof createFlagClient>) {
  return ({ children }: { readonly children: ReactNode }) => <FlagsProvider client={client}>{children}</FlagsProvider>;
}

describe('useFlag', () => {
  it('returns the resolved value of each flag type', () => {
    const client = createFlagClient({ provider: flags });
    const wrapper = wrapperFor(client);

    expect(renderHook(() => useFlag('theme', 'light'), { wrapper }).result.current).toBe('light');
    expect(renderHook(() => useFlag('newNav', false), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useFlag('limits', { max: 10 }), { wrapper }).result.current).toEqual({ max: 25 });
  });

  it('returns the caller default for an unconfigured flag', () => {
    const { result } = renderHook(() => useFlag('absent', 'fallback'), { wrapper: wrapperFor(createFlagClient({ provider: flags })) });
    expect(result.current).toBe('fallback');
  });

  it('works with no FlagsProvider mounted — every flag returns the caller default', () => {
    const { result } = renderHook(() => useFlag('theme', 'light'));
    expect(result.current).toBe('light');
  });

  it('re-evaluates when the context changes imperatively on the client', () => {
    const client = createFlagClient({ provider: flags });
    const { result } = renderHook(() => useFlag('theme', 'light'), { wrapper: wrapperFor(client) });

    expect(result.current).toBe('light');

    act(() => client.setContext({ plan: 'pro' }));

    expect(result.current).toBe('dark');
  });

  it('re-evaluates back when the targeting attribute is removed', () => {
    const client = createFlagClient({ provider: flags, context: { plan: 'pro' } });
    const { result } = renderHook(() => useFlag('theme', 'light'), { wrapper: wrapperFor(client) });

    expect(result.current).toBe('dark');

    act(() => client.setContext({ plan: undefined }));

    expect(result.current).toBe('light');
  });

  it('evaluates against the initial context on the very first render — no flicker through the default', () => {
    const client = createFlagClient({ provider: flags, context: { plan: 'pro' } });
    const { result } = renderHook(() => useFlag('theme', 'light'), { wrapper: wrapperFor(client) });

    expect(result.current).toBe('dark');
  });
});

describe('useFlag — context passed as a prop', () => {
  function ThemeProbe(): ReactNode {
    return <span data-testid="theme">{useFlag('theme', 'light')}</span>;
  }

  it('re-evaluates when the context prop changes', () => {
    const client = createFlagClient({ provider: flags });
    const { rerender } = render(
      <FlagsProvider client={client} context={{ plan: 'free' }}>
        <ThemeProbe />
      </FlagsProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    rerender(
      <FlagsProvider client={client} context={{ plan: 'pro' }}>
        <ThemeProbe />
      </FlagsProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('does not re-notify the provider when a parent re-render supplies a fresh but equal context', () => {
    // The cost the no-op merge actually avoids: a parent that rebuilds its context literal every
    // render would otherwise fire a refetch — and re-render every flag consumer — on each of its
    // own renders. A remote adapter turns that into a request per parent render.
    const onContextChange = vi.fn();
    const client = createFlagClient({ provider: { ...flags, onContextChange } });

    function Parent({ tick }: { readonly tick: number }): ReactNode {
      return (
        <FlagsProvider client={client} context={{ plan: 'pro', roles: ['admin'] }}>
          <ThemeProbe />
          <span data-testid="tick">{tick}</span>
        </FlagsProvider>
      );
    }

    const { rerender } = render(<Parent tick={1} />);
    expect(onContextChange).toHaveBeenCalledTimes(1); // the initial set is a real change

    rerender(<Parent tick={2} />);
    rerender(<Parent tick={3} />);

    expect(screen.getByTestId('tick')).toHaveTextContent('3');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(onContextChange).toHaveBeenCalledTimes(1); // fresh literals, equal attributes → no refetch
  });
});

describe('useFlags', () => {
  it('exposes the client for full evaluations', () => {
    const client = createFlagClient({ provider: flags, context: { plan: 'pro' } });
    const { result } = renderHook(() => useFlags(), { wrapper: wrapperFor(client) });

    expect(result.current).toBe(client);
    expect(result.current.evaluateString('theme', 'light')).toEqual({
      key: 'theme',
      value: 'dark',
      reason: FlagReason.Targeting,
      variant: 'treatment',
    });
  });

  it('builds its own client from a provider prop when none is passed', () => {
    const { result } = renderHook(() => useFlags(), {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <FlagsProvider provider={flags} context={{ plan: 'pro' }}>
          {children}
        </FlagsProvider>
      ),
    });

    expect(result.current.getString('theme', 'light')).toBe('dark');
  });

  it('falls back to a standalone client with no provider mounted', () => {
    const { result } = renderHook(() => useFlags());
    expect(result.current.getBoolean('newNav', false)).toBe(false);
  });
});
