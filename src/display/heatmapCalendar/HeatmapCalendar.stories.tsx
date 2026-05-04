import type { Meta, StoryObj } from '@storybook/react';
import { HeatmapCalendar } from './HeatmapCalendar';

const meta: Meta<typeof HeatmapCalendar> = {
  title: 'Display/HeatmapCalendar',
  component: HeatmapCalendar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof HeatmapCalendar>;

function generateValues(year: number) {
  const values: Record<string, number> = {};
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const cur = new Date(start);
  while (cur <= end) {
    const v = Math.random() < 0.4 ? Math.floor(Math.random() * 30) : 0;
    if (v > 0) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      values[`${y}-${m}-${d}`] = v;
    }
    cur.setDate(cur.getDate() + 1);
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
      onCellClick={(date, value) => alert(`${date}: ${value}`)}
    />
  ),
};
