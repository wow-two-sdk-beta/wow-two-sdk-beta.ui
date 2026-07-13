import type { Meta, StoryObj } from '@storybook/react';
import { RadioField } from '@src/presentation/forms/radioField/RadioField';
import { RadioGroup } from '@src/presentation/forms/radioGroup/RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup legend="Plan" defaultValue="pro">
      <RadioField value="free" label="Free" description="Up to 3 projects." />
      <RadioField value="pro" label="Pro" description="Unlimited projects." />
      <RadioField value="team" label="Team" description="Multiple seats + audit log." />
    </RadioGroup>
  ),
};
