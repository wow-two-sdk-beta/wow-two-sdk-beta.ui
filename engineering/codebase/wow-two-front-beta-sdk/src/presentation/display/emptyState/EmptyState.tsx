import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

/** Defines the EmptyState visual size. */
export const EmptyStateSize = {
  /** Refers to the small layout. */
  Sm: 'sm',
  /** Refers to the medium layout. */
  Md: 'md',
  /** Refers to the large layout. */
  Lg: 'lg',
} as const;

export type EmptyStateSize = (typeof EmptyStateSize)[keyof typeof EmptyStateSize];

export interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** The optional icon (lucide or custom). */
  icon?: ReactNode;

  /** The heading copy. */
  title: ReactNode;

  /** The body copy below the title. */
  description?: ReactNode;

  /** The action(s) — usually one or two `<Button>` elements. */
  actions?: ReactNode;

  /** The visual size. Default `md`. */
  size?: EmptyStateSize;
}

const SIZE: Record<NonNullable<EmptyStateProps['size']>, { wrap: string; iconBox: string }> = {
  sm: { wrap: 'gap-2 py-6', iconBox: 'h-10 w-10' },
  md: { wrap: 'gap-3 py-10', iconBox: 'h-14 w-14' },
  lg: { wrap: 'gap-4 py-16', iconBox: 'h-20 w-20' },
};

/**
 * Empty-list / no-results affordance: icon + title + description + actions.
 * Pass any subset; the component centers everything vertically.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, actions, size = 'md', className, ...props }, ref) => {
    const sz = SIZE[size];
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center text-center', sz.wrap, className)}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
              sz.iconBox,
            )}
          >
            {icon}
          </div>
        )}
        <Heading level={3} size={size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'}>
          {title}
        </Heading>
        {description && <Text color="muted" size={size === 'lg' ? 'md' : 'sm'}>{description}</Text>}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
    );
  },
);
EmptyState.displayName = 'EmptyState';
