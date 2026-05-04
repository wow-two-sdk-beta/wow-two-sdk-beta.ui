import {
  Children,
  forwardRef,
  isValidElement,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';

export interface CommentThreadProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface CommentProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatar / author photo node. */
  avatar?: ReactNode;
  /** Author name. */
  author: ReactNode;
  /** Timestamp / metadata node. */
  timestamp?: ReactNode;
  /** Trailing chip for badges (e.g. "OP", "Author"). */
  badge?: ReactNode;
  /** Body / content. */
  children: ReactNode;
  /** Footer actions (e.g. Reply / Vote / Report). */
  actions?: ReactNode;
  /** Nested replies — pass `<CommentThread.Comment>` items. */
  replies?: ReactNode;
  /** Initial collapsed state for replies. */
  defaultCollapsed?: boolean;
  /** Mark as the OP / highlighted comment. */
  highlighted?: boolean;
}

const CommentThreadInner = forwardRef<HTMLDivElement, CommentThreadProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      role="tree"
      aria-label="Comments"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CommentThreadInner.displayName = 'CommentThread';

export const Comment = forwardRef<HTMLDivElement, CommentProps>(
  (
    {
      avatar,
      author,
      timestamp,
      badge,
      children,
      actions,
      replies,
      defaultCollapsed = false,
      highlighted,
      className,
      ...props
    },
    ref,
  ) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const replyCount = Children.toArray(replies).filter(isValidElement).length;
    const hasReplies = replyCount > 0;

    return (
      <div
        ref={ref}
        role="treeitem"
        aria-expanded={hasReplies ? !collapsed : undefined}
        data-highlighted={highlighted ? '' : undefined}
        className={cn(
          'flex gap-2 rounded-md',
          highlighted && 'bg-primary-soft/30 ring-1 ring-primary/20 p-2',
          className,
        )}
        {...props}
      >
        {/* Avatar + collapse rail */}
        <div className="flex flex-col items-center gap-1">
          <div className="shrink-0">{avatar}</div>
          {hasReplies && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand replies' : 'Collapse replies'}
              className={cn(
                'flex flex-1 items-stretch -my-1 group/rail',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mx-auto w-px flex-1 bg-border transition-colors group-hover/rail:bg-foreground/30',
                  collapsed && 'opacity-40',
                )}
              />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium text-foreground">{author}</span>
            {badge}
            {timestamp && (
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            )}
          </div>
          <div className="mt-1 text-sm text-foreground">{children}</div>
          {actions && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {actions}
            </div>
          )}

          {hasReplies && (
            <div className={cn('mt-2', collapsed && 'hidden')}>
              <div className="flex flex-col gap-3 border-l border-border pl-3">
                {replies}
              </div>
            </div>
          )}

          {hasReplies && collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className={cn(
                'mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
              )}
            >
              <ChevronRight className="h-3 w-3" />
              Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {hasReplies && !collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className={cn(
                'mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
              )}
            >
              <ChevronDown className="h-3 w-3" />
              Collapse
            </button>
          )}
        </div>
      </div>
    );
  },
);
Comment.displayName = 'CommentThread.Comment';

type CommentThreadComponent = typeof CommentThreadInner & {
  Comment: typeof Comment;
};

export const CommentThread = CommentThreadInner as CommentThreadComponent;
CommentThread.Comment = Comment;

export default CommentThread;
