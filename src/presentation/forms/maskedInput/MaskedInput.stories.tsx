import type { Meta, StoryObj } from '@storybook/react';
import { MaskedInput } from './MaskedInput';

const meta: Meta<typeof MaskedInput> = {
  title: 'Forms/MaskedInput',
  component: MaskedInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MaskedInput>;

export const Phone: Story = { args: { mask: '###-###-####', placeholder: '___-___-____' } };
export const Date: Story = { args: { mask: '##/##/####', placeholder: 'MM/DD/YYYY' } };
