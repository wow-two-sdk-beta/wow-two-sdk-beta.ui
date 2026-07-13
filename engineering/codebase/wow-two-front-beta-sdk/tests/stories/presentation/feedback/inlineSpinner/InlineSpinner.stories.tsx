import type { Meta, StoryObj } from '@storybook/react';
import { InlineSpinner } from '@src/presentation/feedback/inlineSpinner/InlineSpinner';

const meta: Meta<typeof InlineSpinner> = {
  title: 'Feedback/InlineSpinner',
  component: InlineSpinner,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof InlineSpinner>;

export const Default: Story = {};
export const Custom: Story = { args: { children: 'Saving changes…' } };
