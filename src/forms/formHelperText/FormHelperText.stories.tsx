import type { Meta, StoryObj } from '@storybook/react';
import { FormHelperText } from './FormHelperText';

const meta: Meta<typeof FormHelperText> = {
  title: 'Forms/FormHelperText',
  component: FormHelperText,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FormHelperText>;

export const Default: Story = { args: { children: 'We never share your email.' } };
