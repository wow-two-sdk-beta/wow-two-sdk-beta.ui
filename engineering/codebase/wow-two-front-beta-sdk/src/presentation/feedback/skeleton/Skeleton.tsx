import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
} from 'react';
import { cn } from '../../../foundation/utils';
import {
  skeletonSlotVariants,
  skeletonVariants,
  type SkeletonAnimation,
  type SkeletonShape,
  type SkeletonVariants,
} from './Skeleton.variants';

// ---- Group context ----

interface SkeletonGroupContextValue {
  loading: boolean;
  animation: SkeletonAnimation | undefined;
}

const SkeletonGroupContext = createContext<SkeletonGroupContextValue | null>(null);

/** Reads the nearest `Skeleton.Group`, or `null` outside one. */
export function useSkeletonGroup(): SkeletonGroupContextValue | null {
  return useContext(SkeletonGroupContext);
}

// ---- Block ----

export interface SkeletonProps
  extends ComponentPropsWithoutRef<'div'>,
    Omit<SkeletonVariants, 'shape' | 'animation'> {
  /** The placeholder shape. */
  shape?: SkeletonShape;

  /** How the placeholder moves; defaults to the nearest `Skeleton.Group`'s, else `pulse`. */
  animation?: SkeletonAnimation;
}

/**
 * Loading placeholder. Use sized via `className` (e.g. `w-32 h-4`) for text
 * lines, or as a full block with `shape="rect"`.
 */
const SkeletonBlock = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, animation, ...props }, ref) => {
    const group = useSkeletonGroup();
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(skeletonVariants({ shape, animation: animation ?? group?.animation }), className)}
        {...props}
      />
    );
  },
);
SkeletonBlock.displayName = 'Skeleton';

// ---- Text ----

export interface SkeletonTextProps extends ComponentPropsWithoutRef<'div'> {
  /** The number of lines. Default `3`. */
  lines?: number;

  /** The last line's width, so the block reads as a paragraph. Default `60%`. */
  lastLineWidth?: string;

  /** How the lines move; defaults to the nearest `Skeleton.Group`'s. */
  animation?: SkeletonAnimation;
}

/** A paragraph placeholder — `lines` text skeletons with a shorter last line. */
export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, lastLineWidth = '60%', animation, className, ...props }, ref) => {
    const count = Math.max(1, Math.floor(lines));
    return (
      <div ref={ref} aria-hidden="true" className={cn('flex flex-col gap-2', className)} {...props}>
        {Array.from({ length: count }, (_, index) => (
          <SkeletonBlock
            key={index}
            shape="text"
            {...(animation ? { animation } : {})}
            style={index === count - 1 && count > 1 ? { width: lastLineWidth } : undefined}
          />
        ))}
      </div>
    );
  },
);
SkeletonText.displayName = 'Skeleton.Text';

// ---- Slot ----

export interface SkeletonSlotProps extends ComponentPropsWithoutRef<'span'> {
  /** Overrides the nearest `Skeleton.Group`'s loading flag. */
  loading?: boolean;

  /** The placeholder's corners; its size always comes from the content. Default `text`. */
  shape?: SkeletonShape;

  /** Renders a block-level wrapper for block content — bars, charts, cards. */
  block?: boolean;

  /** How the placeholder moves; defaults to the nearest `Skeleton.Group`'s. */
  animation?: SkeletonAnimation;
}

/**
 * Wraps real content and, while loading, paints a placeholder exactly its size — the content stays
 * mounted but invisible, so labels and layout hold still and only the value turns into a skeleton.
 */
export const SkeletonSlot = forwardRef<HTMLElement, SkeletonSlotProps>(
  ({ loading, shape, block = false, animation, className, children, ...props }, ref) => {
    const group = useSkeletonGroup();
    const isLoading = loading ?? group?.loading ?? false;
    const Tag = block ? 'div' : 'span';
    return (
      <Tag
        ref={ref as never}
        aria-hidden={isLoading || undefined}
        data-loading={isLoading || undefined}
        // The placeholder merges last, so a caller's text colour or background cannot show through it.
        className={cn(
          block ? 'block' : 'inline-block',
          className,
          isLoading && skeletonSlotVariants({ shape, animation: animation ?? group?.animation }),
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  },
);
SkeletonSlot.displayName = 'Skeleton.Slot';

// ---- Group ----

export interface SkeletonGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Whether the region is loading; every `Skeleton.Slot` inside follows it. */
  loading: boolean;

  /** The one announcement for the region while it loads. Default `"Loading…"`. */
  label?: string;

  /** How every skeleton inside moves. */
  animation?: SkeletonAnimation;
}

/**
 * A loading region: marks itself `aria-busy`, announces once, and switches every `Skeleton.Slot`
 * inside at the same moment — the skeleton-swap pattern for first loads and user-requested refreshes.
 */
export const SkeletonGroup = forwardRef<HTMLDivElement, SkeletonGroupProps>(
  ({ loading, label = 'Loading…', animation, children, ...props }, ref) => {
    const value = useMemo(() => ({ loading, animation }), [loading, animation]);
    return (
      <SkeletonGroupContext.Provider value={value}>
        <div ref={ref} aria-busy={loading || undefined} {...props}>
          {loading && (
            <span role="status" className="sr-only">
              {label}
            </span>
          )}
          {children}
        </div>
      </SkeletonGroupContext.Provider>
    );
  },
);
SkeletonGroup.displayName = 'Skeleton.Group';

/** Placeholders while content loads: a block, and its `Text`, `Slot` and `Group` parts. */
export const Skeleton = Object.assign(SkeletonBlock, {
  Text: SkeletonText,
  Slot: SkeletonSlot,
  Group: SkeletonGroup,
});
