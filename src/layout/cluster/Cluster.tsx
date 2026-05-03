import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface ClusterProps extends ComponentPropsWithoutRef<'div'> {
  /** Gap between children. Default `4`. */
  gap?: '2' | '3' | '4' | '6' | '8';
  /** Justify on cross axis. Default `center`. */
  justify?: 'start' | 'center' | 'end';
}

const GAP: Record<NonNullable<ClusterProps['gap']>, string> = {
  '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '6': 'gap-6', '8': 'gap-8',
};
const JUSTIFY: Record<NonNullable<ClusterProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
};

/**
 * Centered wrapping row — for auth-page action clusters, hero CTAs, footer
 * link groups. `Inline` left-aligns; `Cluster` centers by default.
 */
export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(
  ({ gap = '4', justify = 'center', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center', GAP[gap], JUSTIFY[justify], className)}
      {...props}
    />
  ),
);
Cluster.displayName = 'Cluster';
