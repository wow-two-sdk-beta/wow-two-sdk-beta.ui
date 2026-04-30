import type { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';

const meta: Meta<typeof Code> = {
  title: 'Display/Code',
  component: Code,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Code>;

export const Inline: Story = { args: { children: 'const x = 42;' } };
export const Block: Story = {
  args: { variant: 'block', children: `function add(a, b) {\n  return a + b;\n}` },
};
