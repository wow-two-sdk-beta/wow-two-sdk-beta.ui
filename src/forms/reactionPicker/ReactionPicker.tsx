import { forwardRef, type HTMLAttributes } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils';

export interface ReactionPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** List of emoji shortcuts shown as quick-pick buttons. */
  emojis?: string[];
  /** Currently active emoji keys (highlighted). */
  selected?: string[];
  /** Fires when an emoji is picked. */
  onSelect?: (emoji: string) => void;
  /** Fires when the trailing "more" button is clicked (open full picker). */
  onMore?: () => void;
  /** Hide the trailing "more" button. */
  hideMore?: boolean;
  /** Compact button size. */
  size?: 'sm' | 'md';
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🚀'];

const SIZE: Record<NonNullable<ReactionPickerProps['size']>, string> = {
  sm: 'h-7 w-7 text-base',
  md: 'h-8 w-8 text-lg',
};

/**
 * Quick-pick row of common emoji reactions. Pair with `overlays/Popover`
 * to surface as a hover/long-press affordance on a `ChatBubble`. Click
 * `+` to fall through to a fuller `forms/EmojiPicker`.
 */
export const ReactionPicker = forwardRef<HTMLDivElement, ReactionPickerProps>(
  (
    {
      emojis = DEFAULT_REACTIONS,
      selected,
      onSelect,
      onMore,
      hideMore,
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Reaction picker"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-popover p-1 shadow-sm',
        className,
      )}
      {...props}
    >
      {emojis.map((emoji) => {
        const active = selected?.includes(emoji);
        return (
          <button
            key={emoji}
            type="button"
            data-active={active ? '' : undefined}
            aria-pressed={active}
            aria-label={`React with ${emoji}`}
            onClick={() => onSelect?.(emoji)}
            className={cn(
              'inline-flex items-center justify-center rounded-full leading-none transition-transform',
              'hover:scale-125 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active && 'bg-primary-soft',
              SIZE[size],
            )}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        );
      })}
      {!hideMore && onMore && (
        <button
          type="button"
          aria-label="More reactions"
          onClick={onMore}
          className={cn(
            'inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            SIZE[size],
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  ),
);
ReactionPicker.displayName = 'ReactionPicker';
