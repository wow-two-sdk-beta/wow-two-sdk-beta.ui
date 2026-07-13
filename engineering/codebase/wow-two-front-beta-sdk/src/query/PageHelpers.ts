import type { IHasItems, TokenPage } from '../foundation/http';

// Ergonomic glue between the `foundation/http` pagination contracts (`Page` / `TokenPage`) and the
// paging hooks — fully additive, so a product binding `TPage = Page<T>` / `TokenPage<T>` drops the
// hand-written `getNextPageParam` / `mapPage` boilerplate.

/**
 * A ready `getNextPageParam` for `useAppInfiniteQuery` over `TokenPage` pages — reads `nextPageToken`,
 * returning `undefined` on the last page (an absent token stops paging).
 *
 * `useAppInfiniteQuery<TItem, TokenPage<TItem>>({ getNextPageParam: byPageToken<TItem>(), … })`
 */
export function byPageToken<TItem, TToken = string>(): (lastPage: TokenPage<TItem, TToken>) => TToken | undefined {
  return (lastPage) => lastPage.nextPageToken;
}

/** A ready `mapPage` for any `IHasItems` page — pass `mapPage: pageItems` instead of `(p) => p.items`. */
export function pageItems<T>(page: IHasItems<T>): readonly T[] {
  return page.items;
}
