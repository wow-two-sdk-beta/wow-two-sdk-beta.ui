import type { Meta, StoryObj } from '@storybook/react';
import { Sparkline } from './Sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'Display/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Sparkline>;

const data = [4, 9, 6, 12, 8, 15, 10, 18, 22, 17, 25, 30, 28];

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-12 text-xs text-muted-foreground">line</span>
        <Sparkline data={data} variant="line" showLast />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-xs text-muted-foreground">area</span>
        <Sparkline data={data} variant="area" showLast />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-xs text-muted-foreground">bar</span>
        <Sparkline data={data} variant="bar" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-12 text-xs text-muted-foreground">dot</span>
        <Sparkline data={data} variant="dot" />
      </div>
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3"><Sparkline data={data} tone="brand" /> brand</div>
      <div className="flex items-center gap-3"><Sparkline data={data} tone="success" /> success</div>
      <div className="flex items-center gap-3"><Sparkline data={data} tone="warning" /> warning</div>
      <div className="flex items-center gap-3"><Sparkline data={data} tone="danger" /> danger</div>
      <div className="flex items-center gap-3"><Sparkline data={data} tone="muted" /> muted</div>
    </div>
  ),
};

export const InTable: Story = {
  render: () => (
    <table className="w-[28rem] border-separate border-spacing-y-1 text-sm">
      <tbody>
        {[
          { label: 'Sales', data: [10, 15, 12, 22, 18, 30, 28] },
          { label: 'Visits', data: [200, 220, 180, 260, 245, 290, 320] },
          { label: 'Errors', data: [5, 4, 7, 3, 6, 2, 1] },
        ].map((row) => (
          <tr key={row.label}>
            <td className="text-muted-foreground">{row.label}</td>
            <td><Sparkline data={row.data} tone={row.label === 'Errors' ? 'danger' : 'brand'} /></td>
            <td className="text-right tabular-nums">{row.data[row.data.length - 1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
