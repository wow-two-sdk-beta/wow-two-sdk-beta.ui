import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '@src/presentation/forms/textInput/TextInput';
import { LabeledInput } from '@src/presentation/forms/labeledInput/LabeledInput';

const meta: Meta<typeof LabeledInput> = {
  title: 'Forms/LabeledInput',
  component: LabeledInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LabeledInput>;

export const Default: Story = {
  args: { label: 'Name', trailing: 'Optional' },
  render: (args) => (
    <div className="w-72">
      <LabeledInput {...args}><TextInput placeholder="Sam Person" /></LabeledInput>
    </div>
  ),
};
