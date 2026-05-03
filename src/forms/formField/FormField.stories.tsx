import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '../textInput/TextInput';
import { FormField } from './FormField';

const meta: Meta<typeof FormField> = {
  title: 'Forms/FormField',
  component: FormField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FormField>;

export const WithHelper: Story = {
  args: { label: 'Email', helper: "We'll never share it." },
  render: (args) => (
    <div className="w-72">
      <FormField {...args}><TextInput placeholder="you@example.com" /></FormField>
    </div>
  ),
};

export const WithError: Story = {
  args: { label: 'Email', error: 'Email is required.', isRequired: true },
  render: (args) => (
    <div className="w-72">
      <FormField {...args}><TextInput defaultValue="" /></FormField>
    </div>
  ),
};
