import type { Meta, StoryObj } from '@storybook/react';
import { ActivityFeed } from './ActivityFeed';
import { Avatar } from '../avatar/Avatar';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Display/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ActivityFeed>;

const Strong = ({ children }: { children: string }) => (
  <span className="font-medium text-foreground">{children}</span>
);
const Link = ({ children }: { children: string }) => (
  <a className="text-primary hover:underline" href="#">
    {children}
  </a>
);

export const Project: Story = {
  render: () => (
    <div className="w-[520px]">
      <ActivityFeed>
        <ActivityFeed.Item
          avatar={<Avatar name="Alex Park" size="sm" />}
          timestamp="2h ago"
          actions={
            <>
              <button>Reply</button>
              <button>View</button>
            </>
          }
        >
          <Strong>alex_park</Strong> merged <Link>PR #842</Link> into{' '}
          <Strong>main</Strong>
        </ActivityFeed.Item>

        <ActivityFeed.Item
          avatar={<Avatar name="Jordan" size="sm" />}
          timestamp="3h ago"
          preview="“Looks great — can we shrink the avatar size by 2px?”"
        >
          <Strong>jordan_b</Strong> commented on <Link>PR #842</Link>
        </ActivityFeed.Item>

        <ActivityFeed.Item
          avatar={<Avatar name="Sam" size="sm" />}
          timestamp="6h ago"
        >
          <Strong>sam_io</Strong> opened issue <Link>#412 — Toolbar overflow on iOS</Link>
        </ActivityFeed.Item>

        <ActivityFeed.Item
          avatar={<Avatar name="Riley" size="sm" />}
          timestamp="yesterday"
          last
        >
          <Strong>riley_w</Strong> deployed <Link>v1.4.0</Link> to staging
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
};

export const Dense: Story = {
  render: () => (
    <div className="w-[420px]">
      <ActivityFeed dense>
        <ActivityFeed.Item avatar={<Avatar name="Pat" size="sm" />} timestamp="1m ago">
          <Strong>pat_q</Strong> reacted with 🎉
        </ActivityFeed.Item>
        <ActivityFeed.Item avatar={<Avatar name="Alex" size="sm" />} timestamp="3m ago">
          <Strong>alex_park</Strong> joined the project
        </ActivityFeed.Item>
        <ActivityFeed.Item avatar={<Avatar name="Sam" size="sm" />} timestamp="5m ago" last>
          <Strong>sam_io</Strong> changed status to <Strong>Online</Strong>
        </ActivityFeed.Item>
      </ActivityFeed>
    </div>
  ),
};
