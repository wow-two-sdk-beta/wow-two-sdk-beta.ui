import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Nav/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <div className="p-12">
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Right-click me
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={() => alert('Cut')}>Cut</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => alert('Copy')}>Copy</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => alert('Paste')}>Paste</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item state="destructive" onSelect={() => alert('Delete')}>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  ),
};
