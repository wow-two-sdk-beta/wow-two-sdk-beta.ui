import type { Meta, StoryObj } from '@storybook/react';
import { RadioField } from './RadioField';

const meta: Meta<typeof RadioField> = {
  title: 'Forms/RadioField',
  component: RadioField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RadioField>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <RadioField name="plan" value="free" label="Free" description="Up to 3 projects." defaultChecked />
      <RadioField name="plan" value="pro" label="Pro" description="Unlimited projects + priority support." />
    </div>
  ),
};
