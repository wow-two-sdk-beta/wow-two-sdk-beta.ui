import type { Meta, StoryObj } from '@storybook/react';
import { PinInput } from './PinInput';

const meta: Meta<typeof PinInput> = {
  title: 'Forms/PinInput',
  component: PinInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PinInput>;

export const Default: Story = {};
export const Four: Story = { args: { length: 4 } };
export const Masked: Story = { args: { mask: true, length: 4 } };
export const Alphanumeric: Story = { args: { type: 'alphanumeric', length: 6 } };
