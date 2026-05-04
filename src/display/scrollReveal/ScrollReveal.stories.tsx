import type { Meta, StoryObj } from '@storybook/react';
import { ScrollReveal } from './ScrollReveal';

const meta: Meta = {
  title: 'Display/ScrollReveal',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Scroll down to see effects…</p>
      <div style={{ height: '60vh' }} />
      {(['fade', 'slide-up', 'slide-left', 'slide-right', 'zoom'] as const).map((effect, i) => (
        <ScrollReveal key={effect} effect={effect} delay={i * 100}>
          <div className="rounded-md border border-border bg-card p-6 text-sm">
            <h3 className="font-semibold">{effect}</h3>
            <p className="text-muted-foreground">Revealed via {effect}</p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  ),
};

export const Stagger: Story = {
  render: () => (
    <div className="space-y-3">
      <div style={{ height: '60vh' }} />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <ScrollReveal key={i} effect="slide-up" delay={i * 80}>
            <div className="aspect-square rounded-md bg-primary-soft" />
          </ScrollReveal>
        ))}
      </div>
    </div>
  ),
};
