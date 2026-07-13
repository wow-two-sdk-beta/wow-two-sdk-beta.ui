import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from '@src/presentation/forms/checkboxField/CheckboxField';
import { CheckboxGroup } from '@src/presentation/forms/checkboxGroup/CheckboxGroup';

const meta: Meta<typeof CheckboxGroup> = {
  title: 'Forms/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {
  render: () => (
    <CheckboxGroup legend="Notifications" defaultValue={['email']}>
      <CheckboxField value="email" label="Email" />
      <CheckboxField value="sms" label="SMS" />
      <CheckboxField value="push" label="Push notifications" />
    </CheckboxGroup>
  ),
};
