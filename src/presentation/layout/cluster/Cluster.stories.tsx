import type { Meta, StoryObj } from '@storybook/react';
import { Cluster } from './Cluster';

const meta: Meta<typeof Cluster> = {
  title: 'Layout/Cluster',
  component: Cluster,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Cluster>;

export const Default: Story = {
  render: () => (
    <Cluster className="w-96">
      <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Sign in</button>
      <button className="rounded-md border border-border px-3 py-1.5 text-sm">Create account</button>
    </Cluster>
  ),
};
