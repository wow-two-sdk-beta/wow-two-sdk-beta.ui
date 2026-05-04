import type { Meta, StoryObj } from '@storybook/react';
import { CommentThread } from './CommentThread';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';

const meta: Meta<typeof CommentThread> = {
  title: 'Display/CommentThread',
  component: CommentThread,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CommentThread>;

const ReplyBtn = () => (
  <button type="button" className="hover:underline">
    Reply
  </button>
);
const VoteBtn = () => (
  <button type="button" className="hover:underline">
    ▲ 12
  </button>
);

export const Nested: Story = {
  render: () => (
    <div className="w-[640px]">
      <CommentThread>
        <CommentThread.Comment
          avatar={<Avatar name="Alex Park" size="sm" />}
          author="alex_park"
          timestamp="2h ago"
          badge={<Badge variant="default" size="sm">OP</Badge>}
          highlighted
          actions={
            <>
              <VoteBtn />
              <ReplyBtn />
            </>
          }
          replies={
            <>
              <CommentThread.Comment
                avatar={<Avatar name="Jordan" size="sm" />}
                author="jordan_b"
                timestamp="1h ago"
                actions={<ReplyBtn />}
                replies={
                  <CommentThread.Comment
                    avatar={<Avatar name="Sam" size="sm" />}
                    author="sam_io"
                    timestamp="48m ago"
                    actions={<ReplyBtn />}
                  >
                    Confirmed — same on staging.
                  </CommentThread.Comment>
                }
              >
                Anyone else seeing this on Safari?
              </CommentThread.Comment>
              <CommentThread.Comment
                avatar={<Avatar name="Riley" size="sm" />}
                author="riley_w"
                timestamp="20m ago"
                actions={<ReplyBtn />}
              >
                Adding a regression test in #4421.
              </CommentThread.Comment>
            </>
          }
        >
          The new layout breaks on small screens — the toolbar overflows the
          parent container.
        </CommentThread.Comment>

        <CommentThread.Comment
          avatar={<Avatar name="Pat" size="sm" />}
          author="pat_q"
          timestamp="3h ago"
          actions={<ReplyBtn />}
        >
          Probably related to the new flex container — try `min-w-0` on the
          inner row.
        </CommentThread.Comment>
      </CommentThread>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="w-[480px]">
      <CommentThread>
        <CommentThread.Comment
          avatar={<Avatar name="Alex" size="sm" />}
          author="alex_park"
          timestamp="2h ago"
          defaultCollapsed
          replies={
            <CommentThread.Comment
              avatar={<Avatar name="Jordan" size="sm" />}
              author="jordan_b"
              timestamp="1h ago"
            >
              Hidden by default.
            </CommentThread.Comment>
          }
        >
          Click "Show 1 reply" to expand.
        </CommentThread.Comment>
      </CommentThread>
    </div>
  ),
};
