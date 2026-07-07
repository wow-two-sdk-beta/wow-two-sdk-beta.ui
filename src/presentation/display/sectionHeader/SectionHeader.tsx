import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

/** Defines the SectionHeader title size step. */
export const SectionHeaderSize = {
  /** Refers to the medium step. */
  Md: 'md',
  /** Refers to the large step. */
  Lg: 'lg',
  /** Refers to the extra-large step. */
  Xl: 'xl',
  /** Refers to the 2x-large step. */
  Xxl: '2xl',
} as const;

export type SectionHeaderSize = (typeof SectionHeaderSize)[keyof typeof SectionHeaderSize];

export interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  /** The heading copy. */
  title: ReactNode;

  /** The optional description below the title. */
  description?: ReactNode;

  /** The right-aligned actions slot — typically Button(s). Cross-domain by design, passed as content. */
  actions?: ReactNode;

  /** The heading element / size. Default level 2, size lg. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: SectionHeaderSize;
  /** The bottom border's visibility. Default true. */
  isBordered?: boolean;
}

/**
 * Section / page header — title + optional description + actions row.
 * Wraps `Heading` (semantic) + `Text` (description) + slot for actions.
 */
export const SectionHeader = forwardRef<HTMLElement, SectionHeaderProps>(
  (
    { title, description, actions, level = 2, size = 'lg', isBordered = true, className, ...props },
    ref,
  ) => (
    <header
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-4 pb-3',
        isBordered && 'border-b border-border',
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
