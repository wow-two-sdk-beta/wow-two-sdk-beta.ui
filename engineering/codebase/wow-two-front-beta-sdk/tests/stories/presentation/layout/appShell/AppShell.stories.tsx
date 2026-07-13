import type { Meta, StoryObj } from '@storybook/react';
import { Menu } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Icon } from '@src/foundation/icons';
import { AppShell, useAppShell } from '@src/presentation/layout/appShell/AppShell';
import { useState } from 'react';

const meta: Meta = {
  title: 'Layout/AppShell',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const NAV_ITEMS = ['Dashboard', 'Inbox', 'Projects', 'Calendar', 'Team', 'Settings'];

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <AppShell isSidebarOpen={open} onSidebarOpenChange={setOpen}>
          <AppShell.Header>
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setOpen(true)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <span className="font-semibold">Acme</span>
            <div className="ml-auto text-sm text-muted-foreground">user@acme.com</div>
          </AppShell.Header>
          <AppShell.Sidebar>
            <ul className="space-y-1">
              {NAV_ITEMS.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </AppShell.Sidebar>
          <AppShell.Main>
            <AppShell.Content>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Resize the window — the sidebar collapses to a drawer at &lt; lg breakpoint.
              </p>
              <div className="mt-6 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="rounded-md border border-border bg-card p-4">
                    <div className="text-sm font-medium">Card {i + 1}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Placeholder content
                    </div>
                  </div>
                ))}
              </div>
            </AppShell.Content>
          </AppShell.Main>
          <AppShell.Footer>© Acme — built with @wow-two-beta/ui</AppShell.Footer>
        </AppShell>
      );
    }
    return <Demo />;
  },
};

export const WithAside: Story = {
  render: () => (
    <AppShell>
      <AppShell.Header>
        <span className="font-semibold">Docs</span>
      </AppShell.Header>
      <AppShell.Sidebar>
        <ul className="space-y-1">
          {NAV_ITEMS.map((label) => (
            <li key={label}>
              <a href="#" className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </AppShell.Sidebar>
      <AppShell.Main>
        <div className="flex">
          <AppShell.Content>
            <h1 className="text-2xl font-semibold">Article</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Three-column layout: nav · content · aside (table of contents).
            </p>
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i} className="mt-3 text-sm">
                Paragraph {i + 1}.
              </p>
            ))}
          </AppShell.Content>
          <AppShell.Aside>
            <div className="text-sm font-medium">On this page</div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {['Intro', 'Setup', 'API', 'Examples'].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </AppShell.Aside>
        </div>
      </AppShell.Main>
      <AppShell.Footer>© Acme</AppShell.Footer>
    </AppShell>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: AppShell.tsx source.
 * The shell OWNS the sidebar open state (useControlled) and the responsive
 * collapse decision (useMediaQuery): below `sidebarBreakpoint` the Sidebar
 * renders as a portalled Drawer (role="dialog"), above it as a static aside.
 * The vitest browser viewport is 414×896 (Vitest default), so every
 * breakpoint ≥ sm is collapsed in the harness; stories pin `2xl` and guard
 * on matchMedia so they also hold on an ultra-wide Storybook canvas.
 * ------------------------------------------------------------------------- */

const sidebarOpenChangeSpy = fn();

/** Consumer-side toggle — drives the shell-owned state via useAppShell(). */
const SidebarToggle = () => {
  const { setSidebarOpen } = useAppShell();
  return (
    <button
      type="button"
      aria-label="Open navigation"
      onClick={() => setSidebarOpen(true)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
    >
      <Icon icon={Menu} size={18} />
    </button>
  );
};

export const CollapsedSidebarOpensAsDrawer: Story = {
  render: () => (
    <AppShell sidebarBreakpoint="2xl" onSidebarOpenChange={sidebarOpenChangeSpy}>
      <AppShell.Header>
        <SidebarToggle />
        <span className="font-semibold">Acme</span>
      </AppShell.Header>
      <AppShell.Sidebar>
        <ul className="space-y-1">
          {NAV_ITEMS.map((label) => (
            <li key={label}>
              <a href="#" className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </AppShell.Sidebar>
      <AppShell.Main>
        <AppShell.Content>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </AppShell.Content>
      </AppShell.Main>
      <AppShell.Footer>© Acme</AppShell.Footer>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    // Only meaningful in collapsed mode (viewport < 2xl). Harness: always 414px.
    if (window.matchMedia('(min-width: 1536px)').matches) return;
    sidebarOpenChangeSpy.mockClear();
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    // Collapsed + closed: no static aside, and the drawer isn't mounted.
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Inbox')).not.toBeInTheDocument();

    // Consumer toggle flips the shell-owned state → sidebar portals in as a drawer.
    await userEvent.click(canvas.getByRole('button', { name: 'Open navigation' }));
    const dialog = await body.findByRole('dialog');
    await expect(within(dialog).getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    await expect(sidebarOpenChangeSpy).toHaveBeenLastCalledWith(true);

    // The drawer's focus trap takes over. Nav links are excluded from Radix
    // FocusScope's mount autofocus (removeLinks), so a nav-only drawer parks
    // focus on the scope wrapper itself — assert focus entered the scope.
    await waitFor(() => {
      const active = doc.activeElement;
      const inScope = dialog.contains(active) || (active?.contains(dialog) ?? false);
      expect(inScope).toBe(true);
    });

    // …and Escape dismisses back through the same shell state.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(sidebarOpenChangeSpy).toHaveBeenLastCalledWith(false);
  },
};

export const SkipLinkAndLandmarks: Story = {
  render: () => (
    <AppShell>
      <AppShell.Header>
        <span className="font-semibold">Acme</span>
      </AppShell.Header>
      <AppShell.Sidebar>
        <ul>
          {NAV_ITEMS.map((label) => (
            <li key={label}>
              <a href="#" className="block px-3 py-2 text-sm">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </AppShell.Sidebar>
      <AppShell.Main>
        <AppShell.Content>Content</AppShell.Content>
      </AppShell.Main>
      <AppShell.Footer>© Acme</AppShell.Footer>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Landmark contract the shell owns: banner / main (skip-link target) / contentinfo.
    await expect(canvas.getByRole('banner')).toBeInTheDocument();
    await expect(canvas.getByRole('main')).toHaveAttribute('id', 'app-shell-main');
    await expect(canvas.getByRole('contentinfo')).toBeInTheDocument();

    // The visually-hidden skip link is the very first tab stop on the page.
    await userEvent.tab();
    const skipLink = canvas.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toHaveFocus();
    await expect(skipLink.getAttribute('href')).toBe('#app-shell-main');
  },
};

export const AsideHiddenBelowBreakpoint: Story = {
  render: () => (
    <AppShell asideBreakpoint="2xl">
      <AppShell.Header>
        <span className="font-semibold">Docs</span>
      </AppShell.Header>
      <AppShell.Main>
        <div className="flex">
          <AppShell.Content>
            <h1 className="text-2xl font-semibold">Article</h1>
          </AppShell.Content>
          <AppShell.Aside>
            <div className="text-sm font-medium">On this page</div>
          </AppShell.Aside>
        </div>
      </AppShell.Main>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    // Only meaningful below the aside breakpoint (viewport < 2xl). Harness: 414px.
    if (window.matchMedia('(min-width: 1536px)').matches) return;
    const canvas = within(canvasElement);

    // The aside unmounts entirely below its breakpoint — no complementary landmark.
    await expect(canvas.getByText('Article')).toBeVisible();
    await expect(canvas.queryByRole('complementary')).not.toBeInTheDocument();
    await expect(canvas.queryByText('On this page')).not.toBeInTheDocument();
  },
};
