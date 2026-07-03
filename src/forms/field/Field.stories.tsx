import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '../textInput/TextInput';
import { Field } from './Field';

const meta: Meta<typeof Field> = {
  title: 'Forms/Field',
  component: Field,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Field>;

export const WithHelper: Story = {
  args: { label: 'Email', helper: "We'll never share it." },
  render: (args) => (
    <div className="w-72">
      <Field {...args}><TextInput placeholder="you@example.com" /></Field>
    </div>
  ),
};

export const WithError: Story = {
  args: { label: 'Email', error: 'Email is required.', isRequired: true },
  render: (args) => (
    <div className="w-72">
      <Field {...args}><TextInput defaultValue="" /></Field>
    </div>
  ),
};
