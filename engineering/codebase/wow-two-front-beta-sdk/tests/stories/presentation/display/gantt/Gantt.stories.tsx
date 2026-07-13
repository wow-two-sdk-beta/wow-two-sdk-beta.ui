import type { Meta, StoryObj } from '@storybook/react';
import { Temporal } from 'temporal-polyfill';
import { Gantt, type GanttTask } from '@src/presentation/display/gantt/Gantt';

const meta: Meta<typeof Gantt> = {
  title: 'Display/Gantt',
  component: Gantt,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Gantt>;

const TODAY = Temporal.Now.plainDateISO();
const day = (offset: number): Temporal.PlainDate => TODAY.add({ days: offset });

const TASKS: GanttTask[] = [
  { id: 't1', label: 'Research', start: day(0), end: day(4), progress: 1 },
  { id: 't2', label: 'Design', start: day(3), end: day(9), progress: 0.7 },
  { id: 't3', label: 'Implement', start: day(8), end: day(20), progress: 0.3 },
  { id: 't4', label: 'QA', start: day(18), end: day(24) },
  { id: 't5', label: 'Launch', start: day(24), end: day(25) },
];

export const Default: Story = {
  render: () => (
    <div className="w-[64rem]">
      <Gantt
        tasks={TASKS}
        dependencies={[
          { from: 't1', to: 't2' },
          { from: 't2', to: 't3' },
          { from: 't3', to: 't4' },
          { from: 't4', to: 't5' },
        ]}
        milestones={[{ id: 'm1', label: 'Beta cut', date: day(15) }]}
        onTaskClick={(t) => alert(t.label)}
      />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-[64rem]">
      <Gantt tasks={TASKS} cellWidth={24} rowHeight={28} />
    </div>
  ),
};
