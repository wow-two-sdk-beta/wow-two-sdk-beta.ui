import type { Meta, StoryObj } from '@storybook/react';
import { CurrencyInput } from './CurrencyInput';

const meta: Meta<typeof CurrencyInput> = {
  title: 'Forms/CurrencyInput',
  component: CurrencyInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CurrencyInput>;

export const Default: Story = { args: { defaultValue: 1200, step: 100 } };
export const Euro: Story = { args: { symbol: '€', defaultValue: 99.95, step: 0.05 } };
