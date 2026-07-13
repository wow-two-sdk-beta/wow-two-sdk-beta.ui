import { describe, expect, it } from 'vitest';
import type { Page, TokenPage } from '@src/foundation/http';
import { byPageToken, pageItems } from '@src/query/PageHelpers';

describe('pageItems', () => {
  it('extracts items from any IHasItems page', () => {
    const p: Page<string> = { items: ['a', 'b'], pageNumber: 1, pageSize: 20, totalCount: 2 };
    expect(pageItems(p)).toEqual(['a', 'b']);
  });
});

describe('byPageToken', () => {
  it('reads nextPageToken; undefined on the last page (stops paging)', () => {
    const next = byPageToken<string>();
    const mid: TokenPage<string> = { items: ['a'], pageSize: 20, nextPageToken: 'abc' };
    const last: TokenPage<string> = { items: ['z'], pageSize: 20 };
    expect(next(mid)).toBe('abc');
    expect(next(last)).toBeUndefined();
  });

  it('carries a non-string token type', () => {
    const next = byPageToken<string, number>();
    const p: TokenPage<string, number> = { items: [], pageSize: 20, nextPageToken: 99 };
    expect(next(p)).toBe(99);
  });
});
