import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Plus } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { FAB } from '@src/presentation/actions/fab/FAB';

const meta: Meta<typeof FAB> = {
  title: 'Actions/FAB',
  component: FAB,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {
  args: {
    'aria-label': 'New item',
    children: <Icon icon={Plus} size={24} />,
  },
  render: (args) => (
    <div className="relative h-64 w-full bg-muted">
      <FAB {...args} className="!absolute" />
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — FAB is a stateless pass-through button
 * (no extended/collapsed state), so the surface is click + semantics.
 * ------------------------------------------------------------------------- */

/** Click fires `onClick`; icon-only FAB is named by `aria-label`, default `type` is `button`. */
export const ClickFires: Story = {
  args: {
    'aria-label': 'New item',
    children: <Icon icon={Plus} size={24} />,
    onClick: fn(),
  },
  render: (args) => (
    <div className="relative h-64 w-full bg-muted">
      <FAB {...args} className="!absolute" />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const fab = within(canvasElement).getByRole('button', { name: 'New item' });
    await expect(fab).toHaveAttribute('type', 'button');

    await userEvent.click(fab);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
