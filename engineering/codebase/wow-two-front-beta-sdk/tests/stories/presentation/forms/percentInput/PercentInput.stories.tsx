import type { Meta, StoryObj } from '@storybook/react';
import { PercentInput } from '@src/presentation/forms/percentInput/PercentInput';

const meta: Meta<typeof PercentInput> = {
  title: 'Forms/PercentInput',
  component: PercentInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PercentInput>;

export const Default: Story = { args: { defaultValue: 12.5, step: 0.5, 'aria-label': 'Percentage' } };
