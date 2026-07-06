import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PinInput } from './PinInput';

const meta: Meta<typeof PinInput> = {
  title: 'Forms/PinInput',
  component: PinInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PinInput>;

export const Default: Story = {};
export const Four: Story = { args: { length: 4 } };
export const Masked: Story = { args: { isMasked: true, length: 4 } };
export const Alphanumeric: Story = { args: { type: 'alphanumeric', length: 6 } };

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

export const TypingAdvancesFocus: Story = {
  args: { onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');
    await expect(inputs).toHaveLength(6);

    await userEvent.click(inputs[0]!);
    await userEvent.keyboard('1');
    await expect(inputs[0]).toHaveValue('1');
    await expect(inputs[1]).toHaveFocus();

    await userEvent.keyboard('2');
    await expect(inputs[1]).toHaveValue('2');
    await expect(inputs[2]).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('12');

    /* Non-digit is rejected in numeric mode — value, focus, and spy stay put. */
    await userEvent.keyboard('x');
    await expect(inputs[2]).toHaveValue('');
    await expect(inputs[2]).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('12');
  },
};

export const FillingLastCellFiresOnComplete: Story = {
  args: { length: 4, onValueChange: fn(), onComplete: fn() },
  play: async ({ canvasElement, args }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');

    await userEvent.click(inputs[0]!);
    await userEvent.keyboard('123');
    await expect(args.onComplete).not.toHaveBeenCalled();

    await userEvent.keyboard('4');
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).toHaveBeenCalledWith('1234');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('1234');
    /* Focus parks on the last cell — there is no cell after it. */
    await expect(inputs[3]).toHaveFocus();
  },
};

export const BackspaceMovesToPreviousCell: Story = {
  play: async ({ canvasElement }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');
    await userEvent.click(inputs[0]!);
    await userEvent.keyboard('12');
    await expect(inputs[2]).toHaveFocus();

    /* Backspace on an EMPTY cell moves focus back without clearing anything. */
    await userEvent.keyboard('{Backspace}');
    await expect(inputs[1]).toHaveFocus();
    await expect(inputs[1]).toHaveValue('2');

    /* Backspace on a FILLED cell clears it and stays. */
    await userEvent.keyboard('{Backspace}');
    await expect(inputs[1]).toHaveValue('');
    await expect(inputs[1]).toHaveFocus();

    /* The cell is empty now — the next Backspace steps back again. */
    await userEvent.keyboard('{Backspace}');
    await expect(inputs[0]).toHaveFocus();
    await expect(inputs[0]).toHaveValue('1');
  },
};

export const ArrowKeysMoveFocus: Story = {
  args: { length: 4 },
  play: async ({ canvasElement }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');
    await userEvent.click(inputs[0]!);

    await userEvent.keyboard('{ArrowRight}');
    await expect(inputs[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(inputs[3]).toHaveFocus();
    /* Right edge — focus stays on the last cell. */
    await userEvent.keyboard('{ArrowRight}');
    await expect(inputs[3]).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(inputs[2]).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(inputs[0]).toHaveFocus();
    /* Left edge — focus stays on the first cell. */
    await userEvent.keyboard('{ArrowLeft}');
    await expect(inputs[0]).toHaveFocus();
  },
};

export const PasteSpreadsAcrossCells: Story = {
  args: { onValueChange: fn(), onComplete: fn() },
  play: async ({ canvasElement, args }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');

    /* Partial paste fills from the first cell and focuses the first empty one. */
    await userEvent.click(inputs[0]!);
    await userEvent.paste('1234');
    await expect(inputs[0]).toHaveValue('1');
    await expect(inputs[1]).toHaveValue('2');
    await expect(inputs[2]).toHaveValue('3');
    await expect(inputs[3]).toHaveValue('4');
    await expect(inputs[4]).toHaveValue('');
    await expect(inputs[4]).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('1234');
    await expect(args.onComplete).not.toHaveBeenCalled();

    /* A full-length paste replaces the whole value, completes, and parks focus on the last cell. */
    await userEvent.paste('987654');
    await expect(inputs[0]).toHaveValue('9');
    await expect(inputs[5]).toHaveValue('4');
    await expect(inputs[5]).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('987654');
    await expect(args.onComplete).toHaveBeenCalledWith('987654');
  },
};

export const DisabledBlocksInput: Story = {
  args: { isDisabled: true, onValueChange: fn(), onComplete: fn() },
  play: async ({ canvasElement, args }) => {
    const inputs = within(canvasElement).getAllByRole('textbox');
    for (const input of inputs) {
      await expect(input).toBeDisabled();
    }

    /* Disabled cells refuse focus, so keystrokes have nowhere to land. */
    inputs[0]!.focus();
    await expect(inputs[0]).not.toHaveFocus();
    await userEvent.keyboard('1');
    await expect(inputs[0]).toHaveValue('');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(args.onComplete).not.toHaveBeenCalled();
  },
};
