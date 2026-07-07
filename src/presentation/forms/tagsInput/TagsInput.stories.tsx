import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
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
  render: () => <div className="w-96"><TagsInput defaultValue={['react', 'typescript']} aria-label="Tags" /></div>,
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [tags, setTags] = useState<readonly string[]>(['hello']);
      return (
        <div className="w-96 space-y-2">
          <TagsInput value={tags} onValueChange={setTags} aria-label="Tags" />
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
      <TagsInput defaultValue={['frontend', 'react', 'tailwind']} tagVariant="brand" aria-label="Tags" />
    </div>
  ),
};

export const Capped: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['one', 'two']} max={3} placeholder="max 3" aria-label="Tags" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['locked', 'tags']} disabled aria-label="Tags" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput defaultValue={['oops']} isInvalid aria-label="Tags" />
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

export const EnterAndDelimiterCommitTags: Story = {
  args: { onValueChange: fn(), 'aria-label': 'Tags' },
  render: (args) => (
    <div className="w-96">
      <TagsInput {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    /* Enter commits the typed text as a chip and empties the input. */
    await userEvent.type(input, 'react{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['react']);
    await expect(input).toHaveValue('');
    await expect(canvas.getByText('react')).toBeInTheDocument();

    /* The comma delimiter commits too — the comma itself never lands in the input. */
    await userEvent.type(input, 'vue,');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['react', 'vue']);
    await expect(input).toHaveValue('');

    /* Committed tags are trimmed. */
    await userEvent.type(input, '  svelte  {Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['react', 'vue', 'svelte']);
  },
};

export const BackspaceRemovesLastTagInTwoStages: Story = {
  args: { defaultValue: ['react', 'vue'], onValueChange: fn(), 'aria-label': 'Tags' },
  render: (args) => (
    <div className="w-96">
      <TagsInput {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await userEvent.click(input);

    /* First Backspace on an empty input only ARMS the last tag (pending-delete highlight)… */
    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.getByText('vue')).toHaveAttribute('data-pending-delete');

    /* …the second Backspace actually removes it. */
    await userEvent.keyboard('{Backspace}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['react']);
    await expect(canvas.queryByText('vue')).not.toBeInTheDocument();
    await expect(canvas.getByText('react')).toBeInTheDocument();
  },
};

export const DuplicateTagsAreRejected: Story = {
  args: { defaultValue: ['react'], onValueChange: fn(), 'aria-label': 'Tags' },
  render: (args) => (
    <div className="w-96">
      <TagsInput {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    /* Duplicate commit is refused: no spy call, and the text stays for the user to edit. */
    await userEvent.type(input, 'react{Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(input).toHaveValue('react');
    await expect(canvas.getAllByText('react')).toHaveLength(1);
  },
};

export const MaxCapBlocksFurtherTags: Story = {
  args: { defaultValue: ['one', 'two'], max: 2, onValueChange: fn(), 'aria-label': 'Tags' },
  render: (args) => (
    <div className="w-96">
      <TagsInput {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    await userEvent.type(input, 'three{Enter}');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.queryByText('three')).not.toBeInTheDocument();
    await expect(input).toHaveValue('three');
  },
};

export const ChipCloseButtonRemovesThatTag: Story = {
  args: { defaultValue: ['react', 'vue'], onValueChange: fn(), 'aria-label': 'Tags' },
  render: (args) => (
    <div className="w-96">
      <TagsInput {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    /* Every chip carries a close button (accessible name "Remove") — first one belongs to 'react'. */
    await userEvent.click(canvas.getAllByRole('button', { name: 'Remove' })[0]!);
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith(['vue']);
    await expect(canvas.queryByText('react')).not.toBeInTheDocument();
    await expect(canvas.getByText('vue')).toBeInTheDocument();
  },
};
