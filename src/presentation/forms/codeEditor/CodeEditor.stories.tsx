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
      <CodeEditor defaultValue={SAMPLE} language="javascript" minHeight="14rem" aria-label="Code" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor placeholder="// Type some code…" minHeight="10rem" aria-label="Code" />
    </div>
  ),
};

export const Tabs: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue={SAMPLE} isTabIndented tabSize={4} aria-label="Code" />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue={SAMPLE} readOnly aria-label="Code" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-[40rem]">
      <CodeEditor defaultValue="syntax error here" isInvalid aria-label="Code" />
    </div>
  ),
};
