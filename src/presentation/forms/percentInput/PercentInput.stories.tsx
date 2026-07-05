import type { Meta, StoryObj } from '@storybook/react';
import { PercentInput } from './PercentInput';

const meta: Meta<typeof PercentInput> = {
  title: 'Forms/PercentInput',
  component: PercentInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PercentInput>;

export const Default: Story = { args: { defaultValue: 12.5, step: 0.5 } };
