import { describe, expect, it } from 'vitest';
import type {
  Page,
  TokenPage,
  CursorPage,
  IHasQueryTiming,
  IHasAppliedQuery,
} from '@src/foundation/http/Page';

// Page.ts is type-only; these exercise the composition (each literal must satisfy the composed shape).
describe('Page contracts', () => {
  it('Page<T> composes items + pageNumber + pageSize + totalCount', () => {
    const page: Page<string> = { items: ['a', 'b'], pageNumber: 1, pageSize: 20, totalCount: 42 };
    expect(page.items).toHaveLength(2);
    expect(page.totalCount).toBe(42);
  });

  it('TokenPage<T, TToken> carries a typed cursor; an absent token marks the last page', () => {
    const first: TokenPage<string> = { items: ['a'], pageSize: 20, nextPageToken: 'abc' };
    const last: TokenPage<string> = { items: ['z'], pageSize: 20 };
    expect(first.nextPageToken).toBe('abc');
    expect(last.nextPageToken).toBeUndefined();

    const numeric: TokenPage<string, number> = { items: [], pageSize: 20, nextPageToken: 99 };
    expect(numeric.nextPageToken).toBe(99);
  });

  it('opt-in fragments compose by intersection, no new named type', () => {
    const timed: Page<string> & IHasQueryTiming = {
      items: [],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      queryElapsedMs: 12,
    };
    expect(timed.queryElapsedMs).toBe(12);

    const filtered: Page<string> & IHasAppliedQuery<{ q: string }> = {
      items: [],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      appliedQuery: { q: 'x' },
    };
    expect(filtered.appliedQuery?.q).toBe('x');
  });

  it('CursorPage is a documented alias for TokenPage', () => {
    const c: CursorPage<string> = { items: ['a'], pageSize: 10, nextPageToken: 't' };
    const t: TokenPage<string> = c;
    expect(t.items).toEqual(['a']);
  });
});
