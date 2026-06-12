import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  Breadcrumb,
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSeparator,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Menu,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavItem,
  Pagination,
  ScrollSpy,
  TableOfContents,
  type BreadcrumbItem,
  type TableOfContentsItem,
} from '@wow-two-beta/ui/nav';
import { Badge, SectionHeader } from '@wow-two-beta/ui/display';

/* ---------------------------------------------------------------- fixtures */

const CRUMBS: BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Library', href: '#' },
  { label: 'Nav', href: '#' },
  { label: 'Breadcrumb' },
];

const CRUMBS_SHORT: BreadcrumbItem[] = [
  { label: 'workspace', href: '#' },
  { label: 'frontend', href: '#' },
  { label: 'package.json' },
];

const SIDEBAR_LINKS = [
  { id: 'inbox', label: 'Inbox', count: 12 },
  { id: 'sent', label: 'Sent', count: undefined },
  { id: 'drafts', label: 'Drafts', count: 3 },
  { id: 'archive', label: 'Archive', count: undefined },
] as const;

const TOC_SECTIONS = [
  { id: 'nav-toc-intro', label: 'Introduction', depth: 0 },
  { id: 'nav-toc-install', label: 'Installation', depth: 0 },
  { id: 'nav-toc-pnpm', label: 'Via pnpm', depth: 1 },
  { id: 'nav-toc-usage', label: 'Usage', depth: 0 },
  { id: 'nav-toc-theming', label: 'Theming', depth: 1 },
  { id: 'nav-toc-faq', label: 'FAQ', depth: 0 },
] as const;

const TOC_IDS: string[] = TOC_SECTIONS.map((s) => s.id);

const TOC_ITEMS: TableOfContentsItem[] = TOC_SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
  depth: s.depth,
}));

const TOC_BODY =
  'Scroll this panel — the active entry in the outline follows the topmost visible section. ' +
  'The spy is driven by an IntersectionObserver rooted on this scroll container.';

const TRIGGER_CLS =
  'inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/* ----------------------------------------------------------------- helpers */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}

function Demo({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className ?? ''}`}>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Demo anchors should not fight the hash router — swallow their default nav. */
function stopAnchorNav(e: MouseEvent<HTMLElement>) {
  if ((e.target as HTMLElement).closest('a')) e.preventDefault();
}

/* ------------------------------------------------------------------- page */

export default function NavGallery() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  // NavItem
  const [activeNav, setActiveNav] = useState<string>('inbox');

  // Pagination
  const [page, setPage] = useState(3);
  const [compactPage, setCompactPage] = useState(7);

  // Raw Menu
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);

  // CommandPalette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ScrollSpy + TableOfContents
  const [spyRoot, setSpyRoot] = useState<HTMLDivElement | null>(null);
  const [spyActive, setSpyActive] = useState<string | null>(null);

  const handleTocClick = (e: MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;
    e.preventDefault();
    const id = (link.getAttribute('href') ?? '').slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Last action: <Badge variant="outline">{lastAction ?? 'none yet'}</Badge>
      </p>

      <Section title="Breadcrumb" description="Linear position trail — last item is plain text.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="Breadcrumb — default chevron separator">
            <div onClickCapture={stopAnchorNav}>
              <Breadcrumb items={CRUMBS} />
            </div>
          </Demo>
          <Demo caption="Breadcrumb — custom separator">
            <div onClickCapture={stopAnchorNav}>
              <Breadcrumb items={CRUMBS_SHORT} separator="/" />
            </div>
          </Demo>
        </div>
      </Section>

      <Section title="NavItem" description="Sidebar row — icon + label + trailing slot + active state.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="NavItem — clickable sidebar stack (active follows clicks)">
            <nav className="flex max-w-xs flex-col gap-0.5" onClickCapture={stopAnchorNav}>
              {SIDEBAR_LINKS.map((link) => (
                <NavItem
                  key={link.id}
                  href="#"
                  isActive={activeNav === link.id}
                  icon={<span className="inline-block size-2 rounded-full bg-primary" />}
                  trailing={link.count !== undefined ? <Badge size="sm">{link.count}</Badge> : undefined}
                  onClick={() => setActiveNav(link.id)}
                >
                  {link.label}
                </NavItem>
              ))}
            </nav>
          </Demo>
          <Demo caption="NavItem — sizes sm / md / lg">
            <div className="flex max-w-xs flex-col gap-0.5" onClickCapture={stopAnchorNav}>
              <NavItem href="#" size="sm">
                Small row
              </NavItem>
              <NavItem href="#" size="md" isActive>
                Medium row (active)
              </NavItem>
              <NavItem href="#" size="lg" trailing={<Badge size="sm">99+</Badge>}>
                Large row
              </NavItem>
            </div>
          </Demo>
        </div>
      </Section>

      <Section title="Pagination" description="Stateless page-number row — consumer drives the page.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption={`Pagination — default (page ${page} of 12)`}>
            <Pagination total={12} page={page} onPageChange={setPage} />
          </Demo>
          <Demo caption={`Pagination — hideFirstLast, siblings=2 (page ${compactPage} of 20)`}>
            <Pagination
              total={20}
              page={compactPage}
              onPageChange={setCompactPage}
              siblings={2}
              hideFirstLast
            />
          </Demo>
        </div>
      </Section>

      <Section title="Menu" description="Raw anchored menu — consumer owns open state and anchor.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo caption="Menu — anchored to an external trigger">
            <button
              ref={setMenuAnchor}
              type="button"
              className={TRIGGER_CLS}
              onClick={() => setMenuOpen((o) => !o)}
            >
              Open menu
            </button>
            <Menu
              open={menuOpen}
              anchor={menuAnchor}
              onClose={() => setMenuOpen(false)}
              aria-label="File actions"
            >
              <MenuItem onSelect={() => setLastAction('Menu → New file')}>New file</MenuItem>
              <MenuItem onSelect={() => setLastAction('Menu → Duplicate')}>Duplicate</MenuItem>
              <MenuItem disabled>Share (disabled)</MenuItem>
              <MenuSeparator />
              <MenuItem state="destructive" onSelect={() => setLastAction('Menu → Delete')}>
                Delete
              </MenuItem>
            </Menu>
          </Demo>
          <Demo caption="DropdownMenu — trigger + content, groups and labels">
            <DropdownMenu>
              <DropdownMenuTrigger className={TRIGGER_CLS}>Workspace options</DropdownMenuTrigger>
              <DropdownMenuContent aria-label="Workspace options">
                <MenuLabel>Workspace</MenuLabel>
                <MenuItem onSelect={() => setLastAction('Dropdown → Rename')}>Rename…</MenuItem>
                <MenuItem onSelect={() => setLastAction('Dropdown → Invite members')}>
                  Invite members
                </MenuItem>
                <MenuSeparator />
                <MenuGroup label="Danger zone">
                  <MenuItem
                    state="destructive"
                    onSelect={() => setLastAction('Dropdown → Leave workspace')}
                  >
                    Leave workspace
                  </MenuItem>
                </MenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Demo>
        </div>
      </Section>

      <Section
        title="ContextMenu"
        description="Right-click (or long-press) target — menu opens at the pointer."
      >
        <Demo caption="ContextMenu — trigger surface + content">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-28 select-none items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Right-click here (long-press on touch)
            </ContextMenuTrigger>
            <ContextMenuContent aria-label="Clipboard actions">
              <MenuItem onSelect={() => setLastAction('Context → Cut')}>Cut</MenuItem>
              <MenuItem onSelect={() => setLastAction('Context → Copy')}>Copy</MenuItem>
              <MenuItem onSelect={() => setLastAction('Context → Paste')}>Paste</MenuItem>
              <MenuSeparator />
              <MenuItem state="destructive" onSelect={() => setLastAction('Context → Delete')}>
                Delete
              </MenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Demo>
      </Section>

      <Section
        title="Menubar"
        description="Horizontal app menubar — arrow keys move across, open menu follows."
      >
        <Demo caption="Menubar — File / Edit / View">
          <Menubar aria-label="Demo menubar">
            <MenubarMenu value="file">
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent aria-label="File">
                <MenuItem onSelect={() => setLastAction('Menubar → New tab')}>New tab</MenuItem>
                <MenuItem onSelect={() => setLastAction('Menubar → New window')}>
                  New window
                </MenuItem>
                <MenuSeparator />
                <MenuItem onSelect={() => setLastAction('Menubar → Print')}>Print…</MenuItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="edit">
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent aria-label="Edit">
                <MenuItem onSelect={() => setLastAction('Menubar → Undo')}>Undo</MenuItem>
                <MenuItem onSelect={() => setLastAction('Menubar → Redo')}>Redo</MenuItem>
                <MenuItem disabled>Find (disabled)</MenuItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="view">
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent aria-label="View">
                <MenuItem onSelect={() => setLastAction('Menubar → Zoom in')}>Zoom in</MenuItem>
                <MenuItem onSelect={() => setLastAction('Menubar → Zoom out')}>Zoom out</MenuItem>
                <MenuSeparator />
                <MenuItem onSelect={() => setLastAction('Menubar → Full screen')}>
                  Full screen
                </MenuItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Demo>
      </Section>

      <Section
        title="NavigationMenu"
        description="Site-header navigation — triggers open rich panels, links navigate."
      >
        <Demo caption="NavigationMenu — two panels + plain links">
          <div onClickCapture={stopAnchorNav}>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem value="products">
                  <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-72 gap-1">
                      <li>
                        <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                          <span className="block font-medium text-foreground">Analytics</span>
                          <span className="block text-xs text-muted-foreground">
                            Track usage in real time.
                          </span>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block rounded-sm p-2 text-sm hover:bg-muted">
                          <span className="block font-medium text-foreground">Engagement</span>
                          <span className="block text-xs text-muted-foreground">
                            Boost retention with nudges.
                          </span>
                        </a>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem value="resources">
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-56 gap-1">
                      <li>
                        <a href="#" className="block rounded-sm p-2 text-sm text-foreground hover:bg-muted">
                          Docs
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block rounded-sm p-2 text-sm text-foreground hover:bg-muted">
                          Blog
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block rounded-sm p-2 text-sm text-foreground hover:bg-muted">
                          Changelog
                        </a>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem value="pricing">
                  <NavigationMenuLink href="#">Pricing</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem value="about">
                  <NavigationMenuLink href="#">About</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </Demo>
      </Section>

      <Section
        title="CommandPalette"
        description="Searchable command dialog — opens from the button below."
      >
        <Demo caption="CommandPalette — controlled, behind a trigger">
          <button type="button" className={TRIGGER_CLS} onClick={() => setPaletteOpen(true)}>
            Open command palette
          </button>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
            <CommandPaletteContent>
              <CommandPaletteInput placeholder="Type a command…" />
              <CommandPaletteList>
                <CommandPaletteGroup label="Navigate">
                  <CommandPaletteItem
                    value="dashboard"
                    onSelect={() => setLastAction('Palette → Go to dashboard')}
                  >
                    Go to dashboard
                  </CommandPaletteItem>
                  <CommandPaletteItem
                    value="projects"
                    onSelect={() => setLastAction('Palette → Search projects')}
                  >
                    Search projects
                  </CommandPaletteItem>
                  <CommandPaletteItem
                    value="inbox"
                    onSelect={() => setLastAction('Palette → Open inbox')}
                  >
                    Open inbox
                  </CommandPaletteItem>
                </CommandPaletteGroup>
                <CommandPaletteSeparator />
                <CommandPaletteGroup label="Settings">
                  <CommandPaletteItem
                    value="profile"
                    onSelect={() => setLastAction('Palette → Edit profile')}
                  >
                    Edit profile
                  </CommandPaletteItem>
                  <CommandPaletteItem
                    value="theme"
                    onSelect={() => setLastAction('Palette → Toggle theme')}
                  >
                    Toggle theme
                  </CommandPaletteItem>
                  <CommandPaletteItem value="billing" disabled>
                    Billing (disabled)
                  </CommandPaletteItem>
                </CommandPaletteGroup>
                <CommandPaletteEmpty>No matching commands.</CommandPaletteEmpty>
              </CommandPaletteList>
            </CommandPaletteContent>
          </CommandPalette>
        </Demo>
      </Section>

      <Section
        title="ScrollSpy + TableOfContents"
        description="Outline tracks the topmost visible section of the scroll panel."
      >
        <Demo caption="TableOfContents (activeId driven by ScrollSpy over the panel)">
          <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <div onClickCapture={handleTocClick}>
              <TableOfContents items={TOC_ITEMS} activeId={spyActive} />
            </div>
            <div
              ref={setSpyRoot}
              className="h-64 overflow-y-auto rounded-md border border-border bg-background p-4"
            >
              {TOC_SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="mb-6">
                  <h4 className="mb-1 text-sm font-semibold text-foreground">{s.label}</h4>
                  <p className="text-sm text-muted-foreground">{TOC_BODY}</p>
                </section>
              ))}
              <div className="h-40" aria-hidden="true" />
            </div>
          </div>
          {spyRoot && (
            <ScrollSpy ids={TOC_IDS} root={spyRoot} onActiveChange={setSpyActive}>
              {({ activeId }) => (
                <p className="mt-3 text-xs text-muted-foreground">
                  ScrollSpy active id:{' '}
                  <span className="font-medium text-foreground">{activeId ?? '—'}</span>
                </p>
              )}
            </ScrollSpy>
          )}
        </Demo>
      </Section>
    </div>
  );
}
