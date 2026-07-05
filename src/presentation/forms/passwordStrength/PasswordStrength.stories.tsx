import type { Meta, StoryObj } from '@storybook/react';
import { PasswordStrength } from './PasswordStrength';

const meta: Meta<typeof PasswordStrength> = {
  title: 'Forms/PasswordStrength',
  component: PasswordStrength,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PasswordStrength>;

export const Weak: Story = { args: { value: 'abc' }, render: (a) => <div className="w-72"><PasswordStrength {...a} /></div> };
export const Strong: Story = { args: { value: 'CorrectHorse-Battery-9' }, render: (a) => <div className="w-72"><PasswordStrength {...a} /></div> };
