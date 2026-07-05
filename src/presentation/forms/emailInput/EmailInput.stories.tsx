import type { Meta, StoryObj } from '@storybook/react';
import { EmailInput } from './EmailInput';

const meta: Meta<typeof EmailInput> = {
  title: 'Forms/EmailInput',
  component: EmailInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmailInput>;

export const Default: Story = { args: { placeholder: 'you@example.com' } };
