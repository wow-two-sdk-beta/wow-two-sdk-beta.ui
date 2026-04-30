import type { Meta, StoryObj } from '@storybook/react';
import { FormErrorMessage } from './FormErrorMessage';

const meta: Meta<typeof FormErrorMessage> = {
  title: 'Forms/FormErrorMessage',
  component: FormErrorMessage,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FormErrorMessage>;

export const Default: Story = { args: { children: 'Email is required.' } };
