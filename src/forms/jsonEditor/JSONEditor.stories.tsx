import type { Meta, StoryObj } from '@storybook/react';
import { JSONEditor } from './JSONEditor';

const meta: Meta<typeof JSONEditor> = {
  title: 'Forms/JSONEditor',
  component: JSONEditor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof JSONEditor>;

const SAMPLE = {
  name: 'Acme Corp',
  founded: 1992,
  active: true,
  address: {
    street: '123 Main St',
    city: 'Springfield',
    zip: null,
  },
  tags: ['enterprise', 'b2b'],
  founders: [
    { name: 'Alice', role: 'CEO' },
    { name: 'Bob', role: 'CTO' },
  ],
};

export const Default: Story = {
  render: () => (
    <div className="w-[40rem]">
      <JSONEditor defaultValue={SAMPLE} minHeight="20rem" />
    </div>
  ),
};

export const TextMode: Story = {
  render: () => (
    <div className="w-[40rem]">
      <JSONEditor defaultValue={SAMPLE} defaultMode="text" />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div className="w-[40rem]">
      <JSONEditor defaultValue={SAMPLE} readOnly />
    </div>
  ),
};
