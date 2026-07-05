import type { Meta, StoryObj } from '@storybook/react';
import { Image } from './Image';

const meta: Meta<typeof Image> = {
  title: 'Display/Image',
  component: Image,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {
  args: {
    src: 'https://placehold.co/240x160',
    alt: 'placeholder',
    className: 'rounded-md',
  },
};
export const WithFallback: Story = {
  args: {
    src: '/nonexistent.png',
    alt: '',
    fallback: (
      <div className="grid h-40 w-60 place-items-center rounded-md bg-neutral-100 text-neutral-500">
        Fallback
      </div>
    ),
  },
};
