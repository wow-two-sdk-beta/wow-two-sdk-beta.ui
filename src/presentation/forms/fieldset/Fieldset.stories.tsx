import type { Meta, StoryObj } from '@storybook/react';
import { Fieldset } from './Fieldset';

const meta: Meta<typeof Fieldset> = {
  title: 'Forms/Fieldset',
  component: Fieldset,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Fieldset>;

export const Default: Story = { args: { children: 'Form group content' } };
