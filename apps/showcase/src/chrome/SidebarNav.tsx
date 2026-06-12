import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavItem } from '@wow-two-beta/ui/nav';
import { ROUTES, type RouteGroup } from '../routes';

const GROUP_ORDER: RouteGroup[] = ['Home', 'Screens', 'Galleries', 'Meta'];

/* Sidebar nav driven by ROUTES; rows are lib NavItem anchors. Plain left-click
   is intercepted for SPA navigation; modified / middle clicks keep native
   anchor behavior (new tab etc.). */
export function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    navigate(path);
  };

  return (
    <div className="flex flex-col gap-4">
      {GROUP_ORDER.map((group) => {
        const entries = ROUTES.filter((r) => r.group === group);
        if (entries.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-0.5">
            {group !== 'Home' && (
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle-foreground">
                {group}
              </div>
            )}
            {entries.map(({ path, title }) => (
              <NavItem
                key={path}
                /* HashRouter — native href needs the hash prefix so modified
                   clicks (new tab) land on the right route. */
                href={`#${path}`}
                size="sm"
                isActive={location.pathname === path}
                onClick={(e) => handleClick(e, path)}
              >
                {title}
              </NavItem>
            ))}
          </div>
        );
      })}
    </div>
  );
}
