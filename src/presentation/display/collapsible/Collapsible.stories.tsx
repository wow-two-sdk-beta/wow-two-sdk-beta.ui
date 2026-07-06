import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Collapsible, type CollapsibleProps } from './Collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Display/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        Show details
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 rounded-md border border-border bg-muted p-3 text-sm">
        Hidden content revealed. Click trigger again to collapse.
      </Collapsible.Content>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        Initially open
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 rounded-md border border-border bg-muted p-3 text-sm">
        Pre-expanded.
      </Collapsible.Content>
    </Collapsible>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Collapsible.tsx source.
 * Default content mounts/unmounts through Presence (waitFor covers the exit
 * fade); isForceMounted keeps it in the DOM and collapses it to zero height.
 * ------------------------------------------------------------------------- */

const interactionRender = (args: Pick<CollapsibleProps, 'onOpenChange' | 'isDisabled'>) => (
  <Collapsible onOpenChange={args.onOpenChange} isDisabled={args.isDisabled} className="w-80">
    <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
      Show details
    </Collapsible.Trigger>
    <Collapsible.Content className="mt-2 rounded-md border border-border bg-muted p-3 text-sm">
      Collapsible body
    </Collapsible.Content>
  </Collapsible>
);

export const TriggerTogglesContent: Story = {
  args: { onOpenChange: fn() },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Show details' });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();

    // Open — content mounts, spy observes the change.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    const region = await canvas.findByRole('region', { name: 'Show details' });
    await expect(region).toHaveTextContent('Collapsible body');
    // Trigger ↔ content ARIA pairing.
    await expect(trigger).toHaveAttribute('aria-controls', region.id);
    await expect(region).toHaveAttribute('aria-labelledby', trigger.id);

    // Close — content unmounts once the exit animation finishes (Presence).
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(canvas.queryByRole('region')).not.toBeInTheDocument());
  },
};

export const ForceMountedContentStaysInDom: Story = {
  render: () => (
    <Collapsible className="w-80">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        Show details
      </Collapsible.Trigger>
      <Collapsible.Content isForceMounted className="mt-2 text-sm">
        Collapsible body
      </Collapsible.Content>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Show details' });
    // Force-mounted: content is in the DOM even while closed…
    const region = canvas.getByRole('region', { name: 'Show details' });
    const body = canvas.getByText('Collapsible body');

    // …but hidden by collapsing the grid row to zero height.
    await expect(region).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(body.offsetHeight).toBe(0));

    await userEvent.click(trigger);
    await expect(region).toHaveAttribute('data-state', 'open');
    await waitFor(() => expect(body.offsetHeight).toBeGreaterThan(0));

    await userEvent.click(trigger);
    await expect(region).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(body.offsetHeight).toBe(0));
    // Never unmounts.
    await expect(canvas.getByRole('region')).toBeInTheDocument();
  },
};

export const DisabledTriggerIsInert: Story = {
  args: { onOpenChange: fn(), isDisabled: true },
  render: (args) => interactionRender(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Show details' });

    await expect(trigger).toBeDisabled();
    // Clicks on a disabled control don't fire — nothing opens, spy stays silent.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();
  },
};
