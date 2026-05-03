import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCount } from './CharacterCount';

const meta: Meta<typeof CharacterCount> = {
  title: 'Forms/CharacterCount',
  component: CharacterCount,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CharacterCount>;

export const Under: Story = { args: { value: 80, max: 280 } };
export const Over: Story = { args: { value: 295, max: 280 } };
