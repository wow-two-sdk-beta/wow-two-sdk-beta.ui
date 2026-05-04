import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';

export interface ThreadViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Title for the thread panel header. */
  title?: ReactNode;
  /** Subtitle shown under the title (e.g. "in #engineering"). */
  subtitle?: ReactNode;
  /** Parent message — typically a `<ChatBubble />`. */
  parent: ReactNode;
  /** Reply count label. Pass `null` to hide entirely. */
  replyCount?: ReactNode;
  /** Reply nodes (typically `<ChatBubble />` items). */
  children?: ReactNode;
  /** Composer rendered at the bottom of the panel. */
  composer?: ReactNode;
  /** Fires when the close button is clicked. */
  onClose?: () => void;
  /** Hide the close button. */
  hideCloseButton?: boolean;
}

/**
 * Side-panel layout for a single thread: parent message + reply count
 * separator + reply list + composer. The actual messages stay as
 * children — `ThreadView` only owns the chrome.
 */
export const ThreadView = forwardRef<HTMLDivElement, ThreadViewProps>(
  (
    {
      title = 'Thread',
      subtitle,
      parent,
      replyCount,
      children,
      composer,
      onClose,
      hideCloseButton,
      className,
      ...props
    },
    ref,
  ) => {
    const replies =
      Array.isArray(children) ? children : children == null ? [] : [children];
    const count = replies.length;

    return (
      <div
        ref={ref}
        role="complementary"
        aria-label="Thread"
        className={cn(
          'flex h-full min-h-0 flex-col rounded-md border border-border bg-card',
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          {!hideCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close thread"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div>{parent}</div>
          {replyCount !== null && (
            <div className="my-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {replyCount ??
                  (count === 0
                    ? 'No replies yet'
                    : count === 1
                      ? '1 reply'
                      : `${count} replies`)}
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>
          )}
          <div className="flex flex-col gap-2">{children}</div>
        </div>
        {composer && (
          <div className="border-t border-border px-3 py-2">{composer}</div>
        )}
      </div>
    );
  },
);
ThreadView.displayName = 'ThreadView';
