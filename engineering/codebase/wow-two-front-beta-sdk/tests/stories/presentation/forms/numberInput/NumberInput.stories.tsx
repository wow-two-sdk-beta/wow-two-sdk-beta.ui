import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { NumberInput } from '@src/presentation/forms/numberInput/NumberInput';

const meta: Meta<typeof NumberInput> = {
  title: 'Forms/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = { args: { defaultValue: 0, 'aria-label': 'Amount' } };
export const Step: Story = { args: { defaultValue: 0.5, step: 0.5, 'aria-label': 'Amount' } };

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

export const TypingUpdatesValue: Story = {
  args: { onChange: fn(), 'aria-label': 'Amount' },
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('spinbutton');
    await userEvent.type(input, '42');
    await expect(input).toHaveValue(42);
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const SteppersIncrementAndDecrement: Story = {
  args: { defaultValue: 5, step: 1, onChange: fn(), 'aria-label': 'Amount' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton');
    const increment = canvas.getByRole('button', { name: 'Increment' });
    const decrement = canvas.getByRole('button', { name: 'Decrement' });

    await userEvent.click(increment);
    await expect(input).toHaveValue(6);
    await userEvent.click(increment);
    await expect(input).toHaveValue(7);
    await userEvent.click(decrement);
    await expect(input).toHaveValue(6);
    /* Each stepper click re-dispatches a native input event → exactly one React onChange each. */
    await expect(args.onChange).toHaveBeenCalledTimes(3);
  },
};

export const CustomStepIsRespected: Story = {
  args: { defaultValue: 1, step: 0.5, 'aria-label': 'Amount' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton');

    await userEvent.click(canvas.getByRole('button', { name: 'Increment' }));
    await expect(input).toHaveValue(1.5);
    await userEvent.click(canvas.getByRole('button', { name: 'Decrement' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Decrement' }));
    await expect(input).toHaveValue(0.5);
  },
};

export const SteppingClampsAtMinMax: Story = {
  args: { defaultValue: 9, min: 0, max: 10, step: 1, 'aria-label': 'Amount' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('spinbutton');
    const increment = canvas.getByRole('button', { name: 'Increment' });
    const decrement = canvas.getByRole('button', { name: 'Decrement' });

    await userEvent.click(increment);
    await expect(input).toHaveValue(10);
    /* Already at max — a further increment is a no-op. */
    await userEvent.click(increment);
    await expect(input).toHaveValue(10);

    await userEvent.clear(input);
    await userEvent.type(input, '1');
    await userEvent.click(decrement);
    await expect(input).toHaveValue(0);
    /* Already at min — a further decrement is a no-op. */
    await userEvent.click(decrement);
    await expect(input).toHaveValue(0);
  },
};

/* NOTE — ArrowUp/ArrowDown stepping is NOT covered here: the component delegates arrow-key
   stepping to the browser's native `<input type="number">` default action, which only fires for
   trusted key events. `storybook/test`'s userEvent dispatches synthetic (untrusted) events, so a
   play test cannot exercise it. The same native stepUp()/stepDown() path is proven above via the
   stepper buttons (incl. min/max clamping). */
