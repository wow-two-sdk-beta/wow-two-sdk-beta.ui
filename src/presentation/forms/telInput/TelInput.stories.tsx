import type { Meta, StoryObj } from '@storybook/react';
import { TelInput } from './TelInput';

const meta: Meta<typeof TelInput> = {
  title: 'Forms/TelInput',
  component: TelInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TelInput>;

export const Default: Story = { args: { placeholder: '+1 555 0100' } };
