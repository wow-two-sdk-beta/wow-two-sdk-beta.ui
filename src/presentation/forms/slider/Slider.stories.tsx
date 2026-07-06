import type { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, within } from 'storybook/test';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Forms/Slider',
  component: Slider,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = { args: { defaultValue: 40, 'aria-label': 'Volume' } };

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* NOTE — Arrow/Home/End stepping is NOT covered here: the component is a native
   `<input type="range">`, whose keyboard stepping is a browser default action that only fires
   for trusted key events. `storybook/test`'s userEvent dispatches synthetic (untrusted) events,
   so a play test cannot exercise it. The same native value pipeline (sanitize → clamp → snap)
   is proven below via change events. */

export const ChangeUpdatesValueAndFiresOnChange: Story = {
  args: { defaultValue: 40, onChange: fn(), 'aria-label': 'Volume' },
  play: async ({ canvasElement, args }) => {
    /* A native range input exposes the ARIA slider role. */
    const slider = within(canvasElement).getByRole('slider');
    await expect(slider).toHaveValue('40');

    await fireEvent.change(slider, { target: { value: '65' } });
    await expect(slider).toHaveValue('65');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};

export const OutOfRangeValuesClampToMinMax: Story = {
  args: { defaultValue: 50, min: 0, max: 100, 'aria-label': 'Volume' },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider');
    await expect(slider).toHaveAttribute('min', '0');
    await expect(slider).toHaveAttribute('max', '100');

    /* The native range sanitizer clamps any assignment outside [min, max]. */
    await fireEvent.change(slider, { target: { value: '150' } });
    await expect(slider).toHaveValue('100');
    await fireEvent.change(slider, { target: { value: '-10' } });
    await expect(slider).toHaveValue('0');
  },
};

export const ValuesSnapToStep: Story = {
  args: { defaultValue: 0, min: 0, max: 100, step: 10, 'aria-label': 'Volume' },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider');

    /* Range inputs may not suffer a step mismatch — 37 rounds to the nearest multiple of 10. */
    await fireEvent.change(slider, { target: { value: '37' } });
    await expect(slider).toHaveValue('40');
    await fireEvent.change(slider, { target: { value: '34' } });
    await expect(slider).toHaveValue('30');
  },
};

export const DisabledSliderIsInert: Story = {
  args: { defaultValue: 30, disabled: true, 'aria-label': 'Volume' },
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider');
    await expect(slider).toBeDisabled();
    await expect(slider).toHaveValue('30');
  },
};
