import type { Meta, StoryObj } from '@storybook/react';
import { BannerSimple } from './BannerSimple';

const meta: Meta<typeof BannerSimple> = {
  title: 'Feedback/BannerSimple',
  component: BannerSimple,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BannerSimple>;

export const Default: Story = {
  args: { children: 'New release available — refresh the page to update.' },
};
