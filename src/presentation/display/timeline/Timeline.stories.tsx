import type { Meta, StoryObj } from '@storybook/react';
import { Check, GitCommit, Rocket } from 'lucide-react';
import { Timeline } from './Timeline';

const meta: Meta<typeof Timeline> = {
  title: 'Display/Timeline',
  component: Timeline,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  render: () => (
    <Timeline className="w-96">
      <Timeline.Item status="success" icon={<Check className="h-4 w-4" />}>
        <Timeline.Title>Account created</Timeline.Title>
        <Timeline.Description>2 hours ago</Timeline.Description>
      </Timeline.Item>
      <Timeline.Item status="primary" icon={<GitCommit className="h-4 w-4" />}>
        <Timeline.Title>Initial commit</Timeline.Title>
        <Timeline.Description>1 hour ago</Timeline.Description>
      </Timeline.Item>
      <Timeline.Item status="warning">
        <Timeline.Title>Build queued</Timeline.Title>
        <Timeline.Description>30 min ago</Timeline.Description>
      </Timeline.Item>
      <Timeline.Item status="default" icon={<Rocket className="h-4 w-4" />}>
        <Timeline.Title>Ready to deploy</Timeline.Title>
        <Timeline.Description>now</Timeline.Description>
      </Timeline.Item>
    </Timeline>
  ),
};
