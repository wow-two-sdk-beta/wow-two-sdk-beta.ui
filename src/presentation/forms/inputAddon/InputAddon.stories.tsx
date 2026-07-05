import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '../textInput/TextInput';
import { InputAddon } from './InputAddon';

const meta: Meta<typeof InputAddon> = {
  title: 'Forms/InputAddon',
  component: InputAddon,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof InputAddon>;

export const URL: Story = {
  render: () => (
    <div className="w-96">
      <InputAddon leading="https://" trailing=".com">
        <TextInput placeholder="example" />
      </InputAddon>
    </div>
  ),
};
