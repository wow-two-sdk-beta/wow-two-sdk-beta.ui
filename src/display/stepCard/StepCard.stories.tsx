import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from 'lucide-react';
import { StepCard } from './StepCard';

const meta: Meta<typeof StepCard> = {
  title: 'Display/StepCard',
  component: StepCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[20rem]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof StepCard>;

export const Default: Story = {
  args: {
    step: 1,
    icon: <Grid size={22} />,
    title: 'Create your code',
    description: 'Generate a programmable code in under a minute — no account needed.',
  },
};

export const WithoutIcon: Story = {
  args: {
    step: 2,
    title: 'Add routing rules',
    description: 'Decide where the code resolves by device, country, or time.',
  },
};

export const Sequence: Story = {
  render: () => (
    <div className="grid w-[42rem] grid-cols-3 gap-5">
      <StepCard step={1} icon={<Grid size={22} />} title="Create" description="Make the code." />
      <StepCard step={2} icon={<Grid size={22} />} title="Route" description="Set the rules." />
      <StepCard step={3} icon={<Grid size={22} />} title="Share" description="Print it once." />
    </div>
  ),
};
