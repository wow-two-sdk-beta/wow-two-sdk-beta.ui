import type { Meta, StoryObj } from '@storybook/react';
import { DisclosureButton } from './DisclosureButton';

const meta: Meta<typeof DisclosureButton> = {
  title: 'Actions/DisclosureButton',
  component: DisclosureButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DisclosureButton>;

export const Default: Story = {
  args: { children: 'Section title' },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
};

export const ChevronLeft: Story = {
  args: { children: 'Section title', chevronSide: 'left', defaultOpen: true },
  render: (args) => <div className="w-64"><DisclosureButton {...args} /></div>,
};
