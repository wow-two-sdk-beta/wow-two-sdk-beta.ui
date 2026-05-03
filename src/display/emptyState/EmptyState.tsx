import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

export interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Optional icon (lucide or custom). */
  icon?: ReactNode;
  /** Heading copy. */
  title: ReactNode;
  /** Body copy below the title. */
  description?: ReactNode;
  /** Action(s) — usually one or two `<Button>` elements. */
  actions?: ReactNode;
  /** Visual size. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
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
