import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Grid>;

export const ThreeColumns: Story = {
  render: () => (
    <Grid columns="3" gap="4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-md bg-neutral-100 p-4 text-center">{i + 1}</div>
      ))}
    </Grid>
  ),
};
