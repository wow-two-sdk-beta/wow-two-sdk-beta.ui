import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator } from './TypingIndicator';

const meta: Meta<typeof TypingIndicator> = {
  title: 'Feedback/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TypingIndicator>;

export const Default: Story = {};
export const WithWho: Story = { args: { who: 'Alex' } };
export const Multiple: Story = { args: { who: 'Alex, Jordan and 1 other' } };
export const Primary: Story = { args: { tone: 'primary', who: 'Sam' } };
export const Large: Story = { args: { size: 'lg' } };
export const Subtle: Story = { args: { subtle: true, who: 'Riley' } };
