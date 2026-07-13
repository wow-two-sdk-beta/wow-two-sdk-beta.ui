import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Check, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { cn, Tones } from '../../../foundation/utils';

/** Defines which side of the conversation a bubble sits on. */
export const ChatSide = {
  /** Refers to the inbound side (them). */
  Start: 'start',
  /** Refers to the outbound side (me). */
  End: 'end',
} as const;

export type ChatSide = (typeof ChatSide)[keyof typeof ChatSide];

/** Defines the delivery state of a chat message. */
export const ChatStatus = {
  /** Refers to a message in flight. */
  Sending: 'sending',
  /** Refers to a message sent to the server. */
  Sent: 'sent',
  /** Refers to a message delivered to the recipient. */
  Delivered: 'delivered',
  /** Refers to a message read by the recipient. */
  Read: 'read',
  /** Refers to a message that failed to send. */
  Failed: 'failed',
} as const;

export type ChatStatus = (typeof ChatStatus)[keyof typeof ChatStatus];

/** Defines the chat bubble color tone. */
export const ChatTone = {
  /** Refers to the neutral inbound bubble. */
  Default: 'default',
  /** Refers to the primary outbound bubble. */
  Primary: 'primary',
  /** Refers to a centered, muted system row. */
  System: 'system',
  /** Refers to a subtle bordered bubble. */
  Subtle: 'subtle',
} as const;

export type ChatTone = (typeof ChatTone)[keyof typeof ChatTone];

export interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  /** The side of the conversation. `start` = them, `end` = me. */
  side?: ChatSide;

  /** The bubble color tone. `system` is centered + muted (e.g. "Alex joined"). */
  tone?: ChatTone;

  /** The avatar slot (rendered next to the bubble on the same side). */
  avatar?: ReactNode;

  /** The author label (rendered above the bubble). */
  author?: ReactNode;

  /** The timestamp (rendered next to the status row). */
  timestamp?: ReactNode;

  /** The delivery state. Hidden when `side === 'start'` by default. */
  status?: ChatStatus;

  /** The status-on-inbound override — force-shows status even on the inbound side. */
  canShowStatusOnStart?: boolean;

  /** The tailless mode — hides the bubble's tail (for stacked / grouped messages). */
  isTailless?: boolean;

  /** The reactions / footer slot (e.g. `<ReactionBar />`). */
  footer?: ReactNode;

  /** The bubble body. */
  children: ReactNode;
}

/** Maps each chat tone to the shared `Tones` palette (system stays custom — transparent + italic). */
const TONE_BASE: Record<ChatTone, string> = {
  default: Tones.soft.neutral,
  primary: Tones.solid.primary,
  system: 'bg-transparent text-muted-foreground italic',
  subtle: `border ${Tones.surface.neutral}`,
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
      canShowStatusOnStart,
      isTailless,
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
    const showStatus = !!status && (isEnd || canShowStatusOnStart);

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
              isTailless ? 'rounded-2xl' : isEnd ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm',
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
                // aria-label is prohibited on a generic span — img role carries it.
                <span role="img" aria-label={`Status: ${status}`}>
                  {STATUS_ICON[status]}
                </span>
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
