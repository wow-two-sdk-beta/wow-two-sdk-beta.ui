import type { Meta, StoryObj } from '@storybook/react';
import { TextareaInput } from './TextareaInput';

const meta: Meta<typeof TextareaInput> = {
  title: 'Forms/TextareaInput',
  component: TextareaInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TextareaInput>;

export const Default: Story = { args: { placeholder: 'Tell us more…', rows: 4 } };
