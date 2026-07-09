import type { ReactNode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { useTypedSearchParams } from './UseTypedSearchParams';

afterEach(cleanup);

type Filters = { q: string; page: string };
const defaults: Filters = { q: '', page: '1' };

// A memory router supplies the search-param context. The `MemoryRouter` component (not the
// `createMemoryRouter` data router) is used deliberately: under jsdom the data router builds a
// `new Request(url, { signal })` on every navigation, and jsdom's `AbortSignal` is rejected by Node's
// undici `Request` — so `setValues` would throw. The component router shares the same routing context
// (`useSearchParams` / `useLocation`) without that fetch path.
function setup(initialEntries: string[] = ['/']) {
  return renderHook(() => ({ typed: useTypedSearchParams(defaults), search: useLocation().search }), {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });
}

describe('useTypedSearchParams', () => {
  it('returns the defaults when the URL has no params', () => {
    const { result } = setup(['/']);
    expect(result.current.typed.values).toEqual({ q: '', page: '1' });
  });

  it('reads URL params merged over the defaults', () => {
    const { result } = setup(['/?q=hello']);
    expect(result.current.typed.values.q).toBe('hello');
    expect(result.current.typed.values.page).toBe('1'); // untouched key falls back to default
  });

  it('round-trips a typed set → read', () => {
    const { result } = setup(['/']);
    act(() => {
      result.current.typed.setValues({ q: 'hello' });
    });
    expect(result.current.typed.values.q).toBe('hello');
    expect(result.current.typed.values.page).toBe('1');
  });

  it('preserves untouched typed keys on a partial set', () => {
    const { result } = setup(['/?q=keep']);
    act(() => {
      result.current.typed.setValues({ page: '2' });
    });
    expect(result.current.typed.values.q).toBe('keep');
    expect(result.current.typed.values.page).toBe('2');
  });

  it('preserves params outside the typed set', () => {
    const { result } = setup(['/?ref=abc']);
    act(() => {
      result.current.typed.setValues({ q: 'x' });
    });
    expect(result.current.search).toContain('ref=abc');
    expect(result.current.search).toContain('q=x');
  });

  it('applies sequential sets cumulatively', () => {
    const { result } = setup(['/']);
    act(() => {
      result.current.typed.setValues({ q: 'a' });
    });
    act(() => {
      result.current.typed.setValues({ page: '3' });
    });
    expect(result.current.typed.values.q).toBe('a');
    expect(result.current.typed.values.page).toBe('3');
  });

  it('encodes values written to the URL and reads them back decoded', () => {
    const { result } = setup(['/']);
    act(() => {
      result.current.typed.setValues({ q: 'a b' });
    });
    expect(result.current.search).toContain('q=a+b'); // URLSearchParams encodes space as `+`
    expect(result.current.typed.values.q).toBe('a b'); // decoded on read
  });
});
