import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { LiveCursor } from './LiveCursor';

const meta: Meta<typeof LiveCursor> = {
  title: 'Feedback/LiveCursor',
  component: LiveCursor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LiveCursor>;

export const Static: Story = {
  render: () => (
    <div className="relative h-64 w-full rounded-md border border-border bg-muted/40">
      <LiveCursor x={80} y={40} name="Alex" color="#3b82f6" />
      <LiveCursor x={220} y={120} name="Jordan" color="#22c55e" />
      <LiveCursor x={360} y={70} name="Riley" color="#f59e0b" />
    </div>
  ),
};

export const PointerOnly: Story = {
  render: () => (
    <div className="relative h-64 w-full rounded-md border border-border bg-muted/40">
      <LiveCursor x={120} y={80} pointerOnly color="#dc2626" />
    </div>
  ),
};

function AnimatedDemo() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 80);
    return () => clearInterval(id);
  }, []);
  const a = 100 + Math.sin(t / 10) * 60;
  const b = 80 + Math.cos(t / 12) * 40;
  return (
    <div className="relative h-64 w-full rounded-md border border-border bg-muted/40">
      <LiveCursor x={a} y={b} name="Sam" color="#a855f7" />
      <LiveCursor x={300 - a / 2} y={120 + b / 4} name="Taylor" color="#06b6d4" />
    </div>
  );
}

export const Animated: Story = { render: () => <AnimatedDemo /> };
