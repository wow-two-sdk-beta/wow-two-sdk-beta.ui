import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './Spacer';

const meta: Meta<typeof Spacer> = {
  title: 'Layout/Spacer',
  component: Spacer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Spacer>;

export const Flexible: Story = {
  render: () => (
    <div className="flex w-96 bg-neutral-100 p-3">
      <span>Left</span>
      <Spacer />
      <span>Right</span>
    </div>
  ),
};
export const Fixed: Story = {
  render: () => (
    <div className="flex w-96 bg-neutral-100 p-3">
      <span>A</span>
      <Spacer size={32} />
      <span>B</span>
    </div>
  ),
};
