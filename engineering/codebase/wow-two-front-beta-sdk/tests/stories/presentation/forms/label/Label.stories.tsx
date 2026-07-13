import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@src/presentation/forms/label/Label';

const meta: Meta<typeof Label> = {
  title: 'Forms/Label',
  component: Label,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = { args: { children: 'Email' } };
export const Required: Story = { args: { isRequired: true, children: 'Email' } };
