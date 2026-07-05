import type { Meta, StoryObj } from '@storybook/react';
import { MarkdownEditor } from './MarkdownEditor';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Forms/MarkdownEditor',
  component: MarkdownEditor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

const SAMPLE = `# Welcome

Markdown editor with **toolbar** and *live preview*.

## Features
- Bold / italic / inline code
- Lists and blockquotes
- Headings
- Links

\`\`\`js
const x = 42;
\`\`\`

> "Markdown is just easier."`;

export const Default: Story = {
  render: () => (
    <div className="w-[48rem]">
      <MarkdownEditor defaultValue={SAMPLE} />
    </div>
  ),
};

export const EditOnly: Story = {
  render: () => (
    <div className="w-[36rem]">
      <MarkdownEditor defaultValue={SAMPLE} defaultView="edit" />
    </div>
  ),
};

export const PreviewOnly: Story = {
  render: () => (
    <div className="w-[36rem]">
      <MarkdownEditor defaultValue={SAMPLE} defaultView="preview" readOnly />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[48rem]">
      <MarkdownEditor placeholder="Start typing markdown…" />
    </div>
  ),
};
