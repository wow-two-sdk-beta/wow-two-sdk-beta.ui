import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export type KbdProps = ComponentPropsWithoutRef<'kbd'>;

/**
 * Keyboard key affordance — `<kbd>` styled with subtle border and inset
 * shadow. Single key per `<Kbd>`; chain via `<Kbd>⌘</Kbd> + <Kbd>K</Kbd>`.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-neutral-300',
      'bg-neutral-100 px-1.5 font-mono text-xs text-neutral-700 shadow-[inset_0_-1px_0_0_rgb(0_0_0/0.05)]',
      className,
    )}
    {...props}
  />
));
Kbd.displayName = 'Kbd';
