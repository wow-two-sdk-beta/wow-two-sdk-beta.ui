import type { Meta, StoryObj } from '@storybook/react';
import { FilePicker } from './FilePicker';

const meta: Meta<typeof FilePicker> = {
  title: 'Forms/FilePicker',
  component: FilePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FilePicker>;

/* `label` is the visible trigger-button text; `aria-label` names the sr-only native file input. */
export const Default: Story = {
  args: { onFilesChange: (f) => console.log(f), 'aria-label': 'Choose file' },
};
export const Multiple: Story = {
  args: { multiple: true, label: 'Choose images', accept: 'image/*', 'aria-label': 'Choose images' },
};
