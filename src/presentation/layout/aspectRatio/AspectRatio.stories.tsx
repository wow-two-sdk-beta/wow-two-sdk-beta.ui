import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from './AspectRatio';

const meta: Meta<typeof AspectRatio> = {
  title: 'Layout/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Sixteen9: Story = {
  args: {
    ratio: 16 / 9,
    className: 'w-80 bg-neutral-200 grid place-items-center',
    children: '16 : 9',
  },
};
export const Square: Story = {
  args: {
    ratio: 1,
    className: 'w-60 bg-neutral-200 grid place-items-center',
    children: '1 : 1',
  },
};
