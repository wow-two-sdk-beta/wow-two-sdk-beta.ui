import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
  title: 'Forms/TextInput',
  component: TextInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = { args: { placeholder: 'Type here…', 'aria-label': 'Sample text' } };
export const Invalid: Story = { args: { state: 'invalid', defaultValue: 'oops', 'aria-label': 'Sample text' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'frozen', 'aria-label': 'Sample text' } };
