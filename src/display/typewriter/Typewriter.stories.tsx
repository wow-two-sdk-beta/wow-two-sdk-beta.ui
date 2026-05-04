import type { Meta, StoryObj } from '@storybook/react';
import { Typewriter } from './Typewriter';

const meta: Meta<typeof Typewriter> = {
  title: 'Display/Typewriter',
  component: Typewriter,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Typewriter>;

export const Default: Story = {
  render: () => <Typewriter text="Hello, world." as="div" className="text-3xl font-bold" />,
};

export const Loop: Story = {
  render: () => (
    <Typewriter
      text={['ship better software.', 'build with confidence.', 'design for delight.']}
      as="div"
      className="text-2xl font-semibold"
    />
  ),
};

export const Fast: Story = {
  render: () => (
    <Typewriter
      text={['fast', 'faster', 'fastest']}
      typeSpeed={30}
      deleteSpeed={20}
      pauseBetween={600}
      as="div"
      className="text-xl"
    />
  ),
};
