import { cn } from '../utils';

export interface SpinnerProps {
  className?: string;
}

/**
 * Inlined SVG spinner — `currentColor` so it inherits the parent's text color.
 * Sized at `1em` so it scales with the font of its container.
 *
 * Foundation primitive consumed by Button (loading state), CopyButton, etc.
 * Always pair with `aria-busy="true"` on the parent so screen readers announce
 * the busy state.
 */
export const Spinner = ({ className }: SpinnerProps) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
    width="1em"
    height="1em"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);
