import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TagsInput } from './TagsInput';

const meta: Meta<typeof TagsInput> = {
  title: 'Forms/TagsInput',
  component: TagsInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TagsInput>;

export const Default: Story = {
  render: () => <div className="w-96"><TagsInput defaultValue={['react', 'typescript']} /></div>,
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [tags, setTags] = useState<string[]>(['hello']);
      return (
        <div className="w-96 space-y-2">
          <TagsInput value={tags} onValueChange={setTags} />
          <p className="text-xs text-muted-foreground">
            current: <code>{JSON.stringify(tags)}</code>
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Brand: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['frontend', 'react', 'tailwind']} tagVariant="brand" />
    </div>
  ),
};

export const Capped: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['one', 'two']} max={3} placeholder="max 3" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['locked', 'tags']} disabled />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['oops']} invalid />
    </div>
  ),
};
