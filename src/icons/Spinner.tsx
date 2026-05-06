import { Loader2 } from 'lucide-react';
import { cn } from '../utils';

export interface SpinnerProps {
  className?: string;
}

/** Standardized spinner — Lucide `Loader2` + `animate-spin`, sized at `1em`. */
export const Spinner = ({ className }: SpinnerProps) => (
  <Loader2
    className={cn('animate-spin', className)}
    aria-hidden="true"
    size="1em"
  />
);
