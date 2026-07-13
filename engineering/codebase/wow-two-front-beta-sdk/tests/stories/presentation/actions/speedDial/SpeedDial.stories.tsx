import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Edit, FileText, Mail, Share2 } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { SpeedDial, SpeedDialAction, SpeedDialTrigger } from '@src/presentation/actions/speedDial/SpeedDial';

const meta: Meta = {
  title: 'Actions/SpeedDial',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} tooltip="Edit" />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} tooltip="Share" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};

export const TopLeft: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial position="top-left">
        <SpeedDialAction aria-label="Note" icon={<Icon icon={FileText} size={16} />} tooltip="New note" />
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};

export const RightDirection: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial position="bottom-left" direction="right">
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} tooltip="Edit" />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} tooltip="Share" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: SpeedDial.tsx behavior surface.
 * Enter/exit are animated (Presence-gated) → poll open/close with `waitFor`.
 * ------------------------------------------------------------------------- */

/** Trigger click opens the dial — menu + actions reveal, `aria-expanded` flips. */
export const TriggerOpensAndRevealsActions: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open actions' });

    /* Closed at rest — trigger advertises the popup, actions unmounted. */
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('menu')).toBe(null);

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    /* Enter animation — poll visibility. */
    await waitFor(() =>
      expect(canvas.getByRole('menuitem', { name: 'Mail' })).toBeVisible(),
    );
    await expect(canvas.getAllByRole('menuitem')).toHaveLength(2);
  },
};

/** Action click fires `onSelect`, closes the dial, and returns focus to the trigger. */
export const ActionSelectFiresAndCloses: StoryObj<{ onSelect: () => void }> = {
  args: { onSelect: fn() },
  render: (args) => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction
          aria-label="Edit"
          icon={<Icon icon={Edit} size={16} />}
          onSelect={args.onSelect}
        />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open actions' });

    await userEvent.click(trigger);
    const editAction = await waitFor(() => canvas.getByRole('menuitem', { name: 'Edit' }));
    await waitFor(() => expect(editAction).toBeVisible());

    await userEvent.click(editAction);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);

    /* Exit animation gates unmount → poll; focus returns on the next frame. */
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBe(null));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Escape closes the open dial and refocuses the trigger. */
export const EscapeCloses: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} />
        <SpeedDialAction aria-label="Note" icon={<Icon icon={FileText} size={16} />} />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open actions' });

    await userEvent.click(trigger);
    await waitFor(() => expect(canvas.getByRole('menu')).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(canvas.queryByRole('menu')).toBe(null));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** ArrowDown/ArrowUp move focus across the revealed actions, wrapping at the edges. */
export const ArrowKeysMoveActionFocus: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open actions' });

    await userEvent.click(trigger);
    const mail = await waitFor(() => canvas.getByRole('menuitem', { name: 'Mail' }));
    await waitFor(() => expect(mail).toBeVisible());
    const edit = canvas.getByRole('menuitem', { name: 'Edit' });
    const share = canvas.getByRole('menuitem', { name: 'Share' });

    /* First ArrowDown enters the list (from the trigger). */
    await userEvent.keyboard('{ArrowDown}');
    await expect(mail).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(edit).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await expect(mail).toHaveFocus();

    /* Wraps at the edges. */
    await userEvent.keyboard('{ArrowUp}');
    await expect(share).toHaveFocus();
  },
};
