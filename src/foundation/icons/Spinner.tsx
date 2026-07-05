import { Loader2 } from 'lucide-react';
import { cn } from '../utils';

export interface SpinnerProps {
  /* Extra classes merged onto the underlying SVG. */
  className?: string;
}

/* Renders a spinning loader icon — for inline action-loading feedback or standalone progress indication. */
export const Spinner = ({ className }: SpinnerProps) => (
  <Loader2
    className={cn('animate-spin', className)}
    aria-hidden="true"
    size="1em"
  />
);
