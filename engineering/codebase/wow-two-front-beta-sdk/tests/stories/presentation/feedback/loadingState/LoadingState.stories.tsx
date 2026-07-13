import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from '@src/presentation/feedback/loadingState/LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'Feedback/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = { args: { description: 'Fetching listings…' } };
