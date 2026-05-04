import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Check, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';

export type ChatSide = 'start' | 'end';
export type ChatStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatTone = 'default' | 'primary' | 'system' | 'subtle';

export interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  /** Which side of the conversation. `start` = them, `end` = me. */
  side?: ChatSide;
  /** Bubble color tone. `system` is centered + muted (e.g. "Alex joined"). */
  tone?: ChatTone;
  /** Avatar slot (rendered next to the bubble on the same side). */
  avatar?: ReactNode;
  /** Author label (rendered above the bubble). */
  author?: ReactNode;
  /** Timestamp (rendered next to the status row). */
  timestamp?: ReactNode;
  /** Delivery state. Hidden when `side === 'start'` by default. */
  status?: ChatStatus;
  /** Force-show status even on the inbound side. */
  showStatusOnStart?: boolean;
  /** Hide the bubble's tail (for stacked / grouped messages). */
  tailless?: boolean;
  /** Reactions / footer slot (e.g. `<ReactionBar />`). */
  footer?: ReactNode;
  /** Bubble body. */
  children: ReactNode;
}

const TONE_BASE: Record<ChatTone, string> = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary text-primary-foreground',
  system: 'bg-transparent text-muted-foreground italic',
  subtle: 'bg-card text-card-foreground border border-border',
};

const STATUS_ICON: Record<ChatStatus, ReactNode> = {
  sending: <Clock className="h-3 w-3" />,
  sent: <Check className="h-3 w-3" />,
  delivered: <CheckCheck className="h-3 w-3" />,
  read: <CheckCheck className="h-3 w-3 text-info" />,
  failed: <AlertTriangle className="h-3 w-3 text-destructive" />,
};

/**
 * Single chat message bubble. Compose `<ChatBubble side="end" tone="primary"
 * status="read" timestamp="9:42 AM">…</ChatBubble>` inside a `MessageList`.
 * Use `system` tone for join / leave / metadata rows. Pair the `footer` slot
 * with `display/ReactionBar`.
 */
export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  (
    {
      side = 'start',
      tone,
      avatar,
      author,
      timestamp,
      status,
      showStatusOnStart,
      tailless,
      footer,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isEnd = side === 'end';
    const effectiveTone: ChatTone = tone ?? (isEnd ? 'primary' : 'default');
    const isSystem = effectiveTone === 'system';
    const showStatus = !!status && (isEnd || showStatusOnStart);

    if (isSystem) {
      return (
        <div
          ref={ref}
          data-side={side}
          className={cn('flex w-full justify-center', className)}
          {...props}
        >
          <div className={cn('text-center text-xs', TONE_BASE.system)}>{children}</div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-side={side}
        className={cn(
          'flex w-full gap-2',
          isEnd ? 'flex-row-reverse' : 'flex-row',
          className,
        )}
        {...props}
      >
        {avatar && <div className="shrink-0 self-end">{avatar}</div>}
        <div
          className={cn(
            'flex max-w-[75%] flex-col gap-1',
            isEnd ? 'items-end' : 'items-start',
          )}
        >
          {author && (
            <div className="text-xs font-medium text-muted-foreground">{author}</div>
          )}
          <div
            className={cn(
              'relative inline-block px-3 py-2 text-sm break-words',
              TONE_BASE[effectiveTone],
              tailless ? 'rounded-2xl' : isEnd ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm',
            )}
          >
            {children}
          </div>
          {(timestamp || showStatus) && (
            <div
              className={cn(
                'flex items-center gap-1 text-[11px] text-muted-foreground',
                isEnd ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {timestamp && <span>{timestamp}</span>}
              {showStatus && status && (
                <span aria-label={`Status: ${status}`}>{STATUS_ICON[status]}</span>
              )}
            </div>
          )}
          {footer && <div className={cn(isEnd && 'self-end')}>{footer}</div>}
        </div>
      </div>
    );
  },
);
ChatBubble.displayName = 'ChatBubble';
