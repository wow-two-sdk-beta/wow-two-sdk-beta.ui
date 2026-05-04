import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { SmilePlus } from 'lucide-react';
import { cn } from '../../utils';

export interface Reaction {
  /** Stable id (typically the emoji or shortcode). */
  key: string;
  /** Emoji or icon node displayed in the chip. */
  emoji: ReactNode;
  /** Total count of users who reacted. */
  count: number;
  /** Whether the current viewer has reacted with this. */
  reactedByMe?: boolean;
  /** Optional list of user names — surfaced in the chip's `title`. */
  users?: string[];
}

export interface ReactionBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  reactions: Reaction[];
  /** Click handler for an existing reaction chip. Toggles user's reaction. */
  onReact?: (key: string) => void;
  /** Click handler for the trailing "add" button. Opens a picker. */
  onAdd?: () => void;
  /** Hide the trailing "add reaction" button. */
  hideAddButton?: boolean;
  /** Compact mode — emoji only, no counts. */
  compact?: boolean;
  /** Hide chips with `count === 0`. Default true. */
  hideEmpty?: boolean;
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  reactedByMe?: boolean;
}

function ReactionChip({ reactedByMe, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      data-active={reactedByMe ? '' : undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        reactedByMe
          ? 'border-primary bg-primary-soft text-primary-soft-foreground'
          : 'border-border bg-background hover:bg-muted',
        className,
      )}
      {...rest}
    />
  );
}

/**
 * Row of reaction chips with optional add-reaction button. Each chip toggles
 * `onReact(key)`; the trailing `+` opens a picker via `onAdd`. Pair with
 * `forms/ReactionPicker` to wire the add flow.
 */
export const ReactionBar = forwardRef<HTMLDivElement, ReactionBarProps>(
  (
    {
      reactions,
      onReact,
      onAdd,
      hideAddButton,
      compact,
      hideEmpty = true,
      className,
      ...props
    },
    ref,
  ) => {
    const visible = hideEmpty ? reactions.filter((r) => r.count > 0) : reactions;
    return (
      <div
        ref={ref}
        role="group"
        aria-label="Reactions"
        className={cn('inline-flex flex-wrap items-center gap-1', className)}
        {...props}
      >
        {visible.map((r) => (
          <ReactionChip
            key={r.key}
            reactedByMe={r.reactedByMe}
            title={r.users?.length ? r.users.join(', ') : undefined}
            onClick={() => onReact?.(r.key)}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            {!compact && <span className="font-medium tabular-nums">{r.count}</span>}
          </ReactionChip>
        ))}
        {!hideAddButton && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add reaction"
            className={cn(
              'inline-flex items-center justify-center rounded-full border border-dashed border-border px-2 py-0.5 text-muted-foreground transition-colors',
              'hover:bg-muted hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);
ReactionBar.displayName = 'ReactionBar';
