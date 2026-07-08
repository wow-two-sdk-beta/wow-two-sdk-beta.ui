import type { Meta, StoryObj } from '@storybook/react';
import { Orientation } from '../../../foundation/utils';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-96 bg-background p-3">
      <p className="text-foreground">Above</p>
      <Divider orientation={Orientation.Horizontal} className="my-3" />
      <p className="text-foreground">Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3 bg-background p-3">
      <span className="text-foreground">Left</span>
      <Divider orientation={Orientation.Vertical} />
      <span className="text-foreground">Right</span>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-96 bg-background p-3">
      <Divider label="or" />
    </div>
  ),
};
