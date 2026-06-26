import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavItem } from '@wow-two-beta/ui/nav';
import { ROUTES } from '../routes';

/* Sidebar nav driven by ROUTES; rows are lib NavItem anchors. Plain left-click
   is intercepted for SPA navigation; modified / middle clicks keep native
   anchor behavior (new tab etc.). HashRouter → href carries the `#` prefix. */
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
    <nav className="flex flex-col gap-0.5">
      {ROUTES.map(({ path, title }) => (
        <NavItem
          key={path}
          href={`#${path}`}
          size="sm"
          isActive={location.pathname === path}
          onClick={(e) => handleClick(e, path)}
        >
          {title}
        </NavItem>
      ))}
    </nav>
  );
}
