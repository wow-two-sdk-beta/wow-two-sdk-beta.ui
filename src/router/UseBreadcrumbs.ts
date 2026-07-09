import type { ReactNode } from 'react';
import { useMatches } from 'react-router-dom';

import type { RouteHandle } from './RouteConfig';

/** Represents one breadcrumb derived from a matched route's `handle.crumb`. */
export interface Breadcrumb {
  /** The breadcrumb label to render. */
  readonly crumb: ReactNode;

  /** The matched route's resolved pathname — the crumb's link target. */
  readonly pathname: string;

  /** The matched route's stable match id. */
  readonly id: string;
}

/** Manages the ordered breadcrumb trail derived from the active route matches whose `handle.crumb` is set. */
export function useBreadcrumbs(): readonly Breadcrumb[] {
  const matches = useMatches();
  return matches.flatMap((match) => {
    const crumb = (match.handle as RouteHandle | undefined)?.crumb;
    return crumb != null ? [{ crumb, pathname: match.pathname, id: match.id }] : [];
  });
}
