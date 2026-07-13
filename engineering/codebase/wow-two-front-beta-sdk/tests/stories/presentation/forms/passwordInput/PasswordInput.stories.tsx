import type { Meta, StoryObj } from '@storybook/react';
import { PasswordInput } from '@src/presentation/forms/passwordInput/PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Forms/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = { args: { placeholder: 'Password' } };
export const NoToggle: Story = { args: { hasToggle: false, placeholder: 'Password' } };
