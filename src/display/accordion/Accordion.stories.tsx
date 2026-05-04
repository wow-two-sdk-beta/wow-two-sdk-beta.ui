import type { Meta, StoryObj } from '@storybook/react';
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
    <Accordion type="single" defaultValue="q-1" collapsible className="w-96 rounded-md border border-border">
      <Accordion.Item value="q-1">
        <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        <Accordion.Content>Yes — it follows the WAI-ARIA Accordion pattern.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q-2">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>Default uses a fade. CSS-driven; consumer can extend.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="q-3" disabled>
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
