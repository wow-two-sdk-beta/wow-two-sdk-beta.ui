import type { Meta, StoryObj } from '@storybook/react';
import { CheckboxField } from '../checkboxField/CheckboxField';
import { CheckboxGroup } from './CheckboxGroup';

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
