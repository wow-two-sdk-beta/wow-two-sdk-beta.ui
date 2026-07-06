import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Calendar, FileText, Mail, Settings, User } from 'lucide-react';
import { Icon } from '../../../foundation/icons';
import {
  CommandPalette,
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSeparator,
} from './CommandPalette';

const meta: Meta = {
  title: 'Nav/CommandPalette',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Open palette
          </button>
          <CommandPalette open={open} onOpenChange={setOpen} triggerKey="k">
            <CommandPaletteContent>
              <CommandPaletteInput />
              <CommandPaletteList>
                <CommandPaletteGroup label="Suggestions">
                  <CommandPaletteItem value="calendar" onSelect={() => alert('Calendar')}>
                    <Icon icon={Calendar} size={16} />
                    Calendar
                  </CommandPaletteItem>
                  <CommandPaletteItem value="email" onSelect={() => alert('Email')}>
                    <Icon icon={Mail} size={16} />
                    Search email
                  </CommandPaletteItem>
                  <CommandPaletteItem value="docs" onSelect={() => alert('Docs')}>
                    <Icon icon={FileText} size={16} />
                    Open docs
                  </CommandPaletteItem>
                </CommandPaletteGroup>
                <CommandPaletteSeparator />
                <CommandPaletteGroup label="Settings">
                  <CommandPaletteItem value="profile" onSelect={() => alert('Profile')}>
                    <Icon icon={User} size={16} />
                    Profile
                  </CommandPaletteItem>
                  <CommandPaletteItem value="settings" onSelect={() => alert('Settings')}>
                    <Icon icon={Settings} size={16} />
                    Preferences
                  </CommandPaletteItem>
                </CommandPaletteGroup>
                <CommandPaletteEmpty>No matches.</CommandPaletteEmpty>
              </CommandPaletteList>
            </CommandPaletteContent>
          </CommandPalette>
          <p className="text-xs text-muted-foreground">Tip: try ⌘K / Ctrl+K.</p>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: CommandPalette.tsx (Modal-based).
 * The dialog portals to document.body → query via `canvasElement.ownerDocument
 * .body`. Close is animation-deferred (Presence) → poll with `waitFor`. Items
 * register via post-render effects → active-option assertions poll too.
 * Module-level spies are cleared at play start (stories share the module).
 * ------------------------------------------------------------------------- */

const onCalendarSelect = fn();
const onEmailSelect = fn();
const onDocsSelect = fn();

function InteractionDemo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <CommandPalette defaultOpen={defaultOpen} triggerKey="k">
      <CommandPaletteContent aria-label="Command palette">
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem value="calendar" onSelect={onCalendarSelect}>
            Calendar
          </CommandPaletteItem>
          <CommandPaletteItem value="email" onSelect={onEmailSelect}>
            Search email
          </CommandPaletteItem>
          <CommandPaletteItem value="docs" onSelect={onDocsSelect}>
            Open docs
          </CommandPaletteItem>
          <CommandPaletteItem value="disabled" isDisabled>
            Disabled action
          </CommandPaletteItem>
          <CommandPaletteEmpty>No matches.</CommandPaletteEmpty>
        </CommandPaletteList>
      </CommandPaletteContent>
    </CommandPalette>
  );
}

export const KeyboardShortcutOpens: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');

    const dialog = await body.findByRole('dialog');
    // Fade/pop-in starts at opacity 0 → poll visibility.
    await waitFor(() => expect(dialog).toBeVisible());
    // Input is focused while the palette is open.
    const input = within(dialog).getByRole('combobox');
    await waitFor(() => expect(input).toHaveFocus());
  },
};

export const TypingFiltersItems: Story = {
  render: () => <InteractionDemo defaultOpen />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    const dialog = await body.findByRole('dialog');
    const input = within(dialog).getByRole('combobox');
    await waitFor(() => expect(input).toHaveFocus());
    await expect(within(dialog).getAllByRole('option')).toHaveLength(4);

    await userEvent.keyboard('email');

    // Only the matching item remains; empty state stays hidden.
    await waitFor(() => expect(within(dialog).getAllByRole('option')).toHaveLength(1));
    await waitFor(() =>
      expect(within(dialog).getByRole('option', { name: 'Search email' })).toBeVisible(),
    );
    await expect(within(dialog).queryByText('No matches.')).not.toBeInTheDocument();
  },
};

export const EmptyStateWhenNoMatch: Story = {
  render: () => <InteractionDemo defaultOpen />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    const dialog = await body.findByRole('dialog');
    const input = within(dialog).getByRole('combobox');
    await waitFor(() => expect(input).toHaveFocus());

    await userEvent.keyboard('zzzz');

    await waitFor(() => expect(within(dialog).queryAllByRole('option')).toHaveLength(0));
    // The "no results" message is a polite live region (role="status"), not
    // presentational — screen readers must announce it.
    const empty = await within(dialog).findByRole('status');
    await expect(empty).toHaveTextContent('No matches.');
    await waitFor(() => expect(empty).toBeVisible());
  },
};

export const ArrowNavAndEnterExecutes: Story = {
  render: () => <InteractionDemo defaultOpen />,
  play: async ({ canvasElement }) => {
    onCalendarSelect.mockClear();
    onEmailSelect.mockClear();
    onDocsSelect.mockClear();
    const body = within(canvasElement.ownerDocument.body);

    const dialog = await body.findByRole('dialog');
    const input = within(dialog).getByRole('combobox');
    await waitFor(() => expect(input).toHaveFocus());

    // First item is active once the registry settles (combobox pattern:
    // aria-activedescendant on the input, aria-selected on the option).
    const option = (name: string) => within(dialog).getByRole('option', { name });
    await waitFor(() => expect(option('Calendar')).toHaveAttribute('aria-selected', 'true'));
    await expect(input).toHaveAttribute('aria-activedescendant', option('Calendar').id);

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(option('Search email')).toHaveAttribute('aria-selected', 'true'));
    await expect(option('Calendar')).toHaveAttribute('aria-selected', 'false');
    await expect(input).toHaveAttribute('aria-activedescendant', option('Search email').id);

    // Enter executes the active item exactly once and closes (closeOnSelect).
    await userEvent.keyboard('{Enter}');
    await expect(onEmailSelect).toHaveBeenCalledTimes(1);
    await expect(onCalendarSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const EscapeCloses: Story = {
  render: () => <InteractionDemo defaultOpen />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
