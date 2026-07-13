import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '@src/presentation/forms/textInput/TextInput';
import { InputGroup } from '@src/presentation/forms/inputGroup/InputGroup';

const meta: Meta<typeof InputGroup> = {
  title: 'Forms/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-96">
      <InputGroup>
        <TextInput placeholder="First name" />
        <TextInput placeholder="Last name" />
      </InputGroup>
    </div>
  ),
};
