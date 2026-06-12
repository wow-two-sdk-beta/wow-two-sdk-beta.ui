import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@wow-two-beta/ui/actions';
import { Kbd } from '@wow-two-beta/ui/display';
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSeparator,
} from '@wow-two-beta/ui/nav';
import { ROUTES, type RouteGroup } from '../routes';

const GROUP_ORDER: RouteGroup[] = ['Home', 'Screens', 'Galleries', 'Meta'];

/* Cmd/Ctrl+K route jumper. Closed by default — opens only via the header
   trigger button or the keyboard shortcut, never on mount. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Button
        variant="outline"
        tone="neutral"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Search pages (Cmd+K)"
        trailingSlot={
          <span className="flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        }
      >
        <span className="text-muted-foreground">Search…</span>
      </Button>

      <CommandPalette open={open} onOpenChange={setOpen} triggerKey="k">
        <CommandPaletteContent aria-label="Page search">
          <CommandPaletteInput placeholder="Jump to a page…" />
          <CommandPaletteList>
            {GROUP_ORDER.map((group, index) => {
              const entries = ROUTES.filter((r) => r.group === group);
              if (entries.length === 0) return null;
              return (
                <Fragment key={group}>
                  {index > 0 && <CommandPaletteSeparator />}
                  <CommandPaletteGroup label={group}>
                    {entries.map(({ path, title }) => (
                      <CommandPaletteItem
                        key={path}
                        value={path}
                        searchText={`${title} ${path}`}
                        onSelect={() => navigate(path)}
                      >
                        <span className="flex-1 truncate">{title}</span>
                        <span className="text-xs text-subtle-foreground">{path}</span>
                      </CommandPaletteItem>
                    ))}
                  </CommandPaletteGroup>
                </Fragment>
              );
            })}
            <CommandPaletteEmpty>No matching pages.</CommandPaletteEmpty>
          </CommandPaletteList>
        </CommandPaletteContent>
      </CommandPalette>
    </>
  );
}
