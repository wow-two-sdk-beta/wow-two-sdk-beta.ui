import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

export interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  /** Heading copy. */
  title: ReactNode;
  /** Optional description below the title. */
  description?: ReactNode;
  /** Right-aligned actions slot — typically Button(s). Cross-domain by design,
   *  passed as content. */
  actions?: ReactNode;
  /** Heading element / size. Default level 2, size lg. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'md' | 'lg' | 'xl' | '2xl';
  /** Add a bottom border. Default true. */
  bordered?: boolean;
}

/**
 * Section / page header — title + optional description + actions row.
 * Wraps `Heading` (semantic) + `Text` (description) + slot for actions.
 */
export const SectionHeader = forwardRef<HTMLElement, SectionHeaderProps>(
  (
    { title, description, actions, level = 2, size = 'lg', bordered = true, className, ...props },
    ref,
  ) => (
    <header
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-4 pb-3',
        bordered && 'border-b border-border',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading level={level} size={size}>{title}</Heading>
        {description && <Text size="sm" color="muted">{description}</Text>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  ),
);
SectionHeader.displayName = 'SectionHeader';
