import type { Meta, StoryObj } from '@storybook/react';
import { CodeEditor } from './CodeEditor';

const meta: Meta<typeof CodeEditor> = {
  title: 'Forms/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CodeEditor>;

const SAMPLE = `function greet(name) {
  return 'Hello, ' + name + '!';
}

console.log(greet('world'));`;

export const Default: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue={SAMPLE} language="javascript" minHeight="14rem" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor placeholder="// Type some code…" minHeight="10rem" />
    </div>
  ),
};

export const Tabs: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue={SAMPLE} useTabs tabSize={4} />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue={SAMPLE} readOnly />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue="syntax error here" invalid />
    </div>
  ),
};
