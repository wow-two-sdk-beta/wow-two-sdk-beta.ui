import type { Meta, StoryObj } from '@storybook/react';
import { Tree } from './Tree';

const meta: Meta<typeof Tree> = {
  title: 'Display/Tree',
  component: Tree,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tree>;

export const Default: Story = {
  render: () => (
    <Tree defaultExpanded={['src', 'src/forms']} className="w-72 rounded-md border border-border p-2">
      <Tree.Group value="src" label="src">
        <Tree.Group value="src/forms" label="forms">
          <Tree.Item value="src/forms/Calendar.tsx">Calendar.tsx</Tree.Item>
          <Tree.Item value="src/forms/DatePicker.tsx">DatePicker.tsx</Tree.Item>
        </Tree.Group>
        <Tree.Group value="src/display" label="display">
          <Tree.Item value="src/display/Tabs.tsx">Tabs.tsx</Tree.Item>
          <Tree.Item value="src/display/Tree.tsx">Tree.tsx</Tree.Item>
        </Tree.Group>
        <Tree.Item value="src/index.ts">index.ts</Tree.Item>
      </Tree.Group>
      <Tree.Item value="package.json">package.json</Tree.Item>
      <Tree.Item value="tsconfig.json" disabled>tsconfig.json (disabled)</Tree.Item>
    </Tree>
  ),
};
