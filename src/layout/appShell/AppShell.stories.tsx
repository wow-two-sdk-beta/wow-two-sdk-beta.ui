import type { Meta, StoryObj } from '@storybook/react';
import { Menu } from 'lucide-react';
import { Icon } from '../../icons';
import { AppShell } from './AppShell';
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
        <AppShell sidebarOpen={open} onSidebarOpenChange={setOpen}>
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
