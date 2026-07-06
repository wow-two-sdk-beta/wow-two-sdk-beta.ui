import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import { ToggleButton, type ToggleButtonProps } from '../toggleButton';
import { optionTileVariants } from './OptionTile.variants';

/** Defines props for a single-select preset tile. */
export interface OptionTileProps
  extends Omit<
    ToggleButtonProps,
    'isPressed' | 'defaultPressed' | 'onPressedChange' | 'children' | 'aria-label' | 'title' | 'variant' | 'shape'
  > {
  /** Whether this tile is the active selection. */
  selected: boolean;
  /** Selects this tile. Single-select — the parent owns the value, so re-selecting the active tile is a harmless no-op. */
  onSelect: () => void;
  /** Accessible label + native tooltip — the tile is icon-only, so this is its name. */
  label: string;
  /** The tile's icon, glyph, or swatch. */
  children: ReactNode;
}

/**
 * Renders a square, single-select tile for preset grids (fill types, module /
 * finder shapes, gradient presets) — an icon-only `ToggleButton` (`shape="square"`)
 * with a soft pressed wash. Compose several in a grid; the parent owns the active
 * value. Disable a whole grid by wrapping it in a native `<fieldset disabled>`.
 */
export const OptionTile = forwardRef<HTMLButtonElement, OptionTileProps>(
  ({ selected, onSelect, label, size = 'sm', tone = 'primary', className, children, ...props }, ref) => (
    <ToggleButton
      ref={ref}
      shape="square"
      variant="outline"
      tone={tone}
      size={size}
      isPressed={selected}
      onPressedChange={() => onSelect()}
      aria-label={label}
      title={label}
      className={cn(optionTileVariants(), className)}
      {...props}
    >
      {children}
    </ToggleButton>
  ),
);

OptionTile.displayName = 'OptionTile';
