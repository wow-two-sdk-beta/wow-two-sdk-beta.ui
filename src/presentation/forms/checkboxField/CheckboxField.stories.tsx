import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from './CheckboxField';

const meta: Meta<typeof CheckboxField> = {
  title: 'Forms/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {
  args: { label: 'Send weekly digest', description: 'Summary of activity every Monday morning.' },
};
