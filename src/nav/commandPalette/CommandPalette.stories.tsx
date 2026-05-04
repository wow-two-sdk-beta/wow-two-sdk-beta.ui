import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar, FileText, Mail, Settings, User } from 'lucide-react';
import { Icon } from '../../icons';
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
