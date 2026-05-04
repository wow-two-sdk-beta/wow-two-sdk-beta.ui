import type { Meta, StoryObj } from '@storybook/react';
import {
  ResizablePanel,
  ResizablePanels,
  ResizableSeparator,
} from './ResizablePanels';

const meta: Meta = {
  title: 'Layout/ResizablePanels',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

const Pane = ({ label, tone }: { label: string; tone: string }) => (
  <div className={`flex h-full items-center justify-center text-base font-medium text-card-foreground ${tone}`}>
    {label}
  </div>
);

export const Horizontal: Story = {
  render: () => (
    <div className="h-64 w-[40rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[30, 70]}>
        <ResizablePanel defaultSize={30} minSize={15}>
          <Pane label="Sidebar" tone="bg-muted" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={70} minSize={30}>
          <Pane label="Main" tone="bg-card" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="h-96 w-[28rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="vertical" defaultSizes={[60, 40]}>
        <ResizablePanel defaultSize={60} minSize={20}>
          <Pane label="Editor" tone="bg-card" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={40} minSize={15}>
          <Pane label="Output" tone="bg-muted" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};

export const Tri: Story = {
  render: () => (
    <div className="h-64 w-[48rem] overflow-hidden rounded-md border border-border">
      <ResizablePanels orientation="horizontal" defaultSizes={[20, 60, 20]}>
        <ResizablePanel defaultSize={20} minSize={10}>
          <Pane label="A" tone="bg-primary-soft" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={60} minSize={30}>
          <Pane label="B" tone="bg-card" />
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={20} minSize={10}>
          <Pane label="C" tone="bg-success-soft" />
        </ResizablePanel>
      </ResizablePanels>
    </div>
  ),
};
