import type { Meta, StoryObj } from '@storybook/react';
import { Temporal } from 'temporal-polyfill';
import { HeatmapCalendar } from '@src/presentation/display/heatmapCalendar/HeatmapCalendar';

const meta: Meta<typeof HeatmapCalendar> = {
  title: 'Display/HeatmapCalendar',
  component: HeatmapCalendar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof HeatmapCalendar>;

function generateValues(year: number): Map<Temporal.PlainDate, number> {
  const values = new Map<Temporal.PlainDate, number>();
  const end = Temporal.PlainDate.from({ year, month: 12, day: 31 });
  let cur = Temporal.PlainDate.from({ year, month: 1, day: 1 });
  while (Temporal.PlainDate.compare(cur, end) <= 0) {
    const v = Math.random() < 0.4 ? Math.floor(Math.random() * 30) : 0;
    if (v > 0) values.set(cur, v);
    cur = cur.add({ days: 1 });
  }
  return values;
}

const VALUES_2026 = generateValues(2026);

export const Default: Story = {
  render: () => <HeatmapCalendar values={VALUES_2026} year={2026} />,
};

export const Success: Story = {
  render: () => <HeatmapCalendar values={VALUES_2026} year={2026} tone="success" />,
};

export const Larger: Story = {
  render: () => <HeatmapCalendar values={VALUES_2026} year={2026} cellSize={16} gap={3} />,
};

export const Clickable: Story = {
  render: () => (
    <HeatmapCalendar
      values={VALUES_2026}
      year={2026}
      onCellClick={(date, value) => alert(`${date.toString()}: ${value}`)}
    />
  ),
};
