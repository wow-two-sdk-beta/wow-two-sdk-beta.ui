import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { MeterBar } from '@src/presentation/feedback/meterBar/MeterBar';

const meta: Meta<typeof MeterBar> = {
  title: 'Feedback/MeterBar',
  component: MeterBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MeterBar>;

export const Good: Story = { args: { value: 30 } };
export const Warning: Story = { args: { value: 80 } };
export const Critical: Story = { args: { value: 95 } };

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — MeterBar is non-interactive, so these are
 * render-state assertions on the `role="meter"` semantics and the
 * threshold-zone fill tones.
 * ------------------------------------------------------------------------- */

/** The fill node is the meter's only child; tone classes land on it. */
const fillOf = (meter: HTMLElement) => {
  const fill = meter.firstElementChild;
  if (!(fill instanceof HTMLElement)) throw new Error('MeterBar fill node not found');
  return fill;
};

export const ExposesMeterSemantics: Story = {
  args: { value: 30, label: 'Storage used' },
  render: (args) => <div className="w-64"><MeterBar {...args} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const meter = canvas.getByRole('meter', { name: 'Storage used' });
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
    await expect(meter).toHaveAttribute('aria-valuenow', '30');

    // The fill width mirrors value/max (inline style; computed style resolves to px).
    await expect(fillOf(meter).style.width).toBe('30%');
  },
};

export const ZoneTonesFollowThresholds: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <MeterBar value={30} label="Good zone" />
      <MeterBar value={70} label="Good boundary" />
      <MeterBar value={80} label="Warning zone" />
      <MeterBar value={90} label="Warning boundary" />
      <MeterBar value={95} label="Critical zone" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fill = (name: string) => fillOf(canvas.getByRole('meter', { name }));

    await expect(fill('Good zone').classList.contains('bg-success')).toBe(true);
    // Thresholds are inclusive: value <= good stays success, value <= warn stays warning.
    await expect(fill('Good boundary').classList.contains('bg-success')).toBe(true);
    await expect(fill('Warning zone').classList.contains('bg-warning')).toBe(true);
    await expect(fill('Warning boundary').classList.contains('bg-warning')).toBe(true);
    await expect(fill('Critical zone').classList.contains('bg-destructive')).toBe(true);
  },
};

export const CustomScaleAndThresholds: Story = {
  args: { value: 5, max: 10, thresholds: [6, 8], label: 'Error budget' },
  render: (args) => <div className="w-64"><MeterBar {...args} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const meter = canvas.getByRole('meter', { name: 'Error budget' });
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '10');
    await expect(meter).toHaveAttribute('aria-valuenow', '5');

    const fill = fillOf(meter);
    await expect(fill.style.width).toBe('50%');
    await expect(fill.classList.contains('bg-success')).toBe(true);
  },
};
