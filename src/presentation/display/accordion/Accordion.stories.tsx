import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Accordion } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Display/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="q-1" isCollapsible className="w-96 rounded-md border border-border">
      <Accordion.Item value="q-1">
        <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        <Accordion.Content>Yes — it follows the WAI-ARIA Accordion pattern.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q-2">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>Default uses a fade. CSS-driven; consumer can extend.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q-3" isDisabled>
        <Accordion.Trigger>Disabled item</Accordion.Trigger>
        <Accordion.Content>Cannot expand.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['q-1', 'q-2']} className="w-96 rounded-md border border-border">
      <Accordion.Item value="q-1">
        <Accordion.Trigger>Both panels open by default</Accordion.Trigger>
        <Accordion.Content>Multi-mode lets any number stay open at once.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q-2">
        <Accordion.Trigger>Toggle independently</Accordion.Trigger>
        <Accordion.Content>Clicking one doesn't close another.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Accordion.tsx source.
 * Content mounts/unmounts through Presence: open asserts can query straight
 * away (findByRole), close asserts wait out the exit transition via `waitFor`.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <Accordion type="single" isCollapsible className="w-96 rounded-md border border-border">
    <Accordion.Item value="a">
      <Accordion.Trigger>Item A</Accordion.Trigger>
      <Accordion.Content>
        <div className="p-3">Panel A content</div>
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="b">
      <Accordion.Trigger>Item B</Accordion.Trigger>
      <Accordion.Content>
        <div className="p-3">Panel B content</div>
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="c" isDisabled>
      <Accordion.Trigger>Item C</Accordion.Trigger>
      <Accordion.Content>
        <div className="p-3">Panel C content</div>
      </Accordion.Content>
    </Accordion.Item>
  </Accordion>
);

export const ClickTogglesPanel: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Item A' });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const region = await canvas.findByRole('region', { name: 'Item A' });
    await expect(region).toHaveTextContent('Panel A content');
    // Trigger ↔ panel ARIA pairing.
    await expect(trigger).toHaveAttribute('aria-controls', region.id);
    await expect(region).toHaveAttribute('aria-labelledby', trigger.id);

    // isCollapsible single mode: clicking the open header collapses it again.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(canvas.queryByRole('region')).not.toBeInTheDocument());
  },
};

export const SingleModeIsExclusive: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerA = canvas.getByRole('button', { name: 'Item A' });
    const triggerB = canvas.getByRole('button', { name: 'Item B' });

    await userEvent.click(triggerA);
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true');

    // Opening B closes A — at most one panel open in single mode.
    await userEvent.click(triggerB);
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true');
    await expect(triggerA).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(canvas.getAllByRole('region')).toHaveLength(1));
    await expect(canvas.getByRole('region')).toHaveTextContent('Panel B content');
  },
};

export const MultipleModeTogglesIndependently: Story = {
  render: () => (
    <Accordion type="multiple" className="w-96 rounded-md border border-border">
      <Accordion.Item value="a">
        <Accordion.Trigger>Item A</Accordion.Trigger>
        <Accordion.Content>
          <div className="p-3">Panel A content</div>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Item B</Accordion.Trigger>
        <Accordion.Content>
          <div className="p-3">Panel B content</div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerA = canvas.getByRole('button', { name: 'Item A' });
    const triggerB = canvas.getByRole('button', { name: 'Item B' });

    await userEvent.click(triggerA);
    await userEvent.click(triggerB);
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true');
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getAllByRole('region')).toHaveLength(2));

    // Closing A leaves B open.
    await userEvent.click(triggerA);
    await expect(triggerA).toHaveAttribute('aria-expanded', 'false');
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getAllByRole('region')).toHaveLength(1));
    await expect(canvas.getByRole('region')).toHaveTextContent('Panel B content');
  },
};

export const KeyboardTogglesAndRoves: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerA = canvas.getByRole('button', { name: 'Item A' });
    const triggerB = canvas.getByRole('button', { name: 'Item B' });

    // Roving tabindex: the group exposes a single tab stop (the first header).
    await userEvent.tab();
    await expect(triggerA).toHaveFocus();
    await expect(triggerB).toHaveAttribute('tabindex', '-1');

    // Enter toggles the focused header.
    await userEvent.keyboard('{Enter}');
    await expect(triggerA).toHaveAttribute('aria-expanded', 'true');

    // ArrowDown roves focus to the next header (vertical group).
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(triggerB).toHaveFocus());
    await expect(triggerB).toHaveAttribute('tabindex', '0');
    await expect(triggerA).toHaveAttribute('tabindex', '-1');

    // Space toggles too; single mode closes A when B opens.
    await userEvent.keyboard(' ');
    await expect(triggerB).toHaveAttribute('aria-expanded', 'true');
    await expect(triggerA).toHaveAttribute('aria-expanded', 'false');

    // ArrowUp roves back.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(triggerA).toHaveFocus());
  },
};

export const DisabledItemIsInert: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Item C' });

    // Native disabled + data-disabled styling (pointer-events: none) — a real
    // user cannot activate it, so the panel stays closed.
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveAttribute('data-disabled');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();
  },
};
