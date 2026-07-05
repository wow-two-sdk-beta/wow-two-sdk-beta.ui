import type { Meta, StoryObj } from '@storybook/react';
import { UrlInput } from './UrlInput';

const meta: Meta<typeof UrlInput> = {
  title: 'Forms/UrlInput',
  component: UrlInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof UrlInput>;

export const Default: Story = { args: { placeholder: 'https://example.com' } };
