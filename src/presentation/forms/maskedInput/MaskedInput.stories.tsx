import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MaskedInput } from './MaskedInput';

const meta: Meta<typeof MaskedInput> = {
  title: 'Forms/MaskedInput',
  component: MaskedInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MaskedInput>;

export const Phone: Story = {
  args: { mask: '###-###-####', placeholder: '___-___-____', 'aria-label': 'Phone number' },
};
export const Date: Story = {
  args: { mask: '##/##/####', placeholder: 'MM/DD/YYYY', 'aria-label': 'Date' },
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

export const TypingAppliesPhoneMask: Story = {
  args: { mask: '###-###-####', onValueChange: fn(), 'aria-label': 'Phone number' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox');

    /* Digits only — the dashes come from the mask; the spy reflects the MASKED value. */
    await userEvent.type(input, '5551234567');
    await expect(input).toHaveValue('555-123-4567');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('555-123-4567');
  },
};

export const LiteralsAutoInsert: Story = {
  args: { mask: '##/##/####', onValueChange: fn(), 'aria-label': 'Date' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox');

    /* The slash appears as soon as the character AFTER it is typed. */
    await userEvent.type(input, '123');
    await expect(input).toHaveValue('12/3');
    await userEvent.type(input, '12026');
    await expect(input).toHaveValue('12/31/2026');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('12/31/2026');
  },
};

export const InvalidCharactersAreRejected: Story = {
  args: { mask: '###-###-####', 'aria-label': 'Phone number' },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox');

    /* Letters never match a digit slot — nothing sticks. */
    await userEvent.type(input, 'abc');
    await expect(input).toHaveValue('');

    /* Mid-stream invalid characters are dropped; valid ones keep flowing into the mask. */
    await userEvent.type(input, '12x34');
    await expect(input).toHaveValue('123-4');
  },
};

export const MaskCapsLengthAndEnforcesCharacterClasses: Story = {
  args: { mask: 'AAA-###', onValueChange: fn(), 'aria-label': 'Product code' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('textbox');

    /* Letters fill the `A` slots, digits fill the `#` slots, the letter aimed at a digit slot
       ('d') is rejected, and input beyond the mask length ('4') is dropped. */
    await userEvent.type(input, 'abcd1234');
    await expect(input).toHaveValue('abc-123');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('abc-123');
  },
};
