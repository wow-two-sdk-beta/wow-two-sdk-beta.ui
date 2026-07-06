import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { Fieldset } from '../../forms/fieldset';
import { optionTileGroupVariants, type OptionTileGroupAlign } from './OptionTileGroup.variants';

/** Defines props for a group of option tiles. */
export interface OptionTileGroupProps {
  /** The group's accessible name. */
  readonly label: string;

  /** Disable the whole group — greys + blocks every tile via a native `<fieldset disabled>`. */
  readonly disabled?: boolean;

  /** Wrap tiles onto multiple rows. Default `false` (single row). */
  readonly wrap?: boolean;

  /** Main-axis alignment of the tiles. Default `start`. */
  readonly align?: OptionTileGroupAlign;

  /** The `OptionTile` children. */
  readonly children: ReactNode;

  /** Extra classes for the group container. */
  readonly className?: string;
}

/**
 * Renders a labelled group of `OptionTile`s — a reset `<fieldset>` (native
 * `disabled` greys + blocks the whole group) laid out as a tile row, with the
 * group's accessible name on `aria-label`.
 */
export const OptionTileGroup = forwardRef<HTMLFieldSetElement, OptionTileGroupProps>(
  ({ label, disabled, wrap, align, className, children }, ref) => (
    <Fieldset
      ref={ref}
      disabled={disabled}
      aria-label={label}
      className={cn(optionTileGroupVariants({ wrap, align }), className)}
    >
      {children}
    </Fieldset>
  ),
);

OptionTileGroup.displayName = 'OptionTileGroup';
