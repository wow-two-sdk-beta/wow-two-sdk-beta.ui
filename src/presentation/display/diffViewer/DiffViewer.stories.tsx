import type { Meta, StoryObj } from '@storybook/react';
import { DiffViewer } from './DiffViewer';

const meta: Meta<typeof DiffViewer> = {
  title: 'Display/DiffViewer',
  component: DiffViewer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DiffViewer>;

const LEFT = `function greet(name) {
  console.log('Hello, ' + name);
  return 'done';
}`;

const RIGHT = `function greet(name, greeting = 'Hello') {
  if (!name) return 'no name';
  console.log(greeting + ', ' + name);
  return 'done';
}`;

export const Split: Story = {
  render: () => (
    <div className="w-[48rem]">
      <DiffViewer left={LEFT} right={RIGHT} view="split" />
    </div>
  ),
};

export const Unified: Story = {
  render: () => (
    <div className="w-[36rem]">
      <DiffViewer left={LEFT} right={RIGHT} view="unified" />
    </div>
  ),
};

export const Identical: Story = {
  render: () => (
    <div className="w-[36rem]">
      <DiffViewer left={LEFT} right={LEFT} />
    </div>
  ),
};
