import type { Meta, StoryObj } from '@storybook/react';
import { TextAreaInput } from './TextAreaInput';

const meta: Meta<typeof TextAreaInput> = {
  title: 'Forms/TextAreaInput',
  component: TextAreaInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TextAreaInput>;

export const Default: Story = { args: { placeholder: 'Tell us more…', rows: 4 } };
