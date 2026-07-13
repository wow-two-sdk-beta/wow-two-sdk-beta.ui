import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';

import { NavItem } from '../presentation/nav';

import type { LazyRoute } from './RouteConfig';
import { prefetchProps } from './UsePrefetch';

/** Defines props for the sidebar nav link. */
interface AppNavLinkProps {
  /** The destination path. */
  readonly to: string;

  /** The leading icon rendered before the label. */
  readonly icon?: ReactNode;

  /** The link label. */
  readonly children: ReactNode;

  /** Whether to match the destination exactly (no descendant paths) for the active state. */
  readonly end?: boolean;

  /** Whether to animate this navigation with the View Transitions API. */
  readonly viewTransition?: boolean;

  /** The destination's lazy module — warmed on hover / focus (intent prefetch). */
  readonly prefetch?: LazyRoute;
}

/** Renders a nav row — the SDK `NavItem` chrome (`asChild`) forwarding to a router `<Link>`, active from the route match. */
export function AppNavLink({ to, icon, children, end, viewTransition, prefetch }: AppNavLinkProps) {
  const isActive = useMatch({ path: to, end: end ?? false }) != null;
  const intent = prefetch ? prefetchProps(prefetch) : undefined;
  return (
    <NavItem asChild isActive={isActive} icon={icon}>
      <Link to={to} viewTransition={viewTransition} {...intent}>
        {children}
      </Link>
    </NavItem>
  );
}
