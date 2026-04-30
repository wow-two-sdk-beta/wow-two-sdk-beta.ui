import type { Meta, StoryObj } from '@storybook/react';
import { NumberInput } from './NumberInput';

const meta: Meta<typeof NumberInput> = {
  title: 'Forms/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = { args: { defaultValue: 0 } };
export const Step: Story = { args: { defaultValue: 0.5, step: 0.5 } };
