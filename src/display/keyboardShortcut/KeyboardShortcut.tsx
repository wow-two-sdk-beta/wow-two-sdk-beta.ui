import { forwardRef, Fragment, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { Kbd } from '../kbd/Kbd';

export interface KeyboardShortcutProps extends ComponentPropsWithoutRef<'span'> {
  /** Keys in order — e.g. `['⌘', 'K']` or `['Ctrl', 'Shift', 'P']`. */
  keys: string[];
  /** Connector between keys. Default `'+'`; pass `' '` for spaced keys. */
  separator?: string;
}

/**
 * Render a sequence of `Kbd` keys with connectors between them — e.g.
 * `<KeyboardShortcut keys={['⌘', 'K']} />` → ⌘ + K.
 */
export const KeyboardShortcut = forwardRef<HTMLSpanElement, KeyboardShortcutProps>(
  ({ keys, separator = '+', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-flex items-center gap-1 text-muted-foreground', className)}
      {...props}
    >
      {keys.map((key, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">{separator}</span>}
          <Kbd>{key}</Kbd>
        </Fragment>
      ))}
    </span>
  ),
);
KeyboardShortcut.displayName = 'KeyboardShortcut';
