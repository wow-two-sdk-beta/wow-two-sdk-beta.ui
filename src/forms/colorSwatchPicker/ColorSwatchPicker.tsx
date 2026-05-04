import { type HTMLAttributes, type KeyboardEvent } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { RovingFocusGroup, useRovingFocusItem } from '../../primitives';
import { ColorSwatch, type ColorSwatchVariants } from '../colorSwatch';

export interface ColorSwatchPickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  colors: string[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (color: string) => void;
  swatchSize?: ColorSwatchVariants['size'];
  swatchShape?: ColorSwatchVariants['shape'];
  disabled?: boolean;
}

interface ItemProps {
  color: string;
  selected: boolean;
  disabled: boolean;
  size?: ColorSwatchVariants['size'];
  shape?: ColorSwatchVariants['shape'];
  onSelect: (color: string) => void;
}

function ColorSwatchItem({ color, selected, disabled, size, shape, onSelect }: ItemProps) {
  const roving = useRovingFocusItem();
  return (
    <ColorSwatch
      ref={roving.ref as never}
      color={color}
      size={size}
      shape={shape}
      selected={selected}
      disabled={disabled}
      tabIndex={roving.tabIndex}
      onClick={() => onSelect(color)}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        roving.onKeyDown(e);
        if (e.defaultPrevented) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(color);
        }
      }}
      onFocus={roving.onFocus}
      data-roving-focus-item
      aria-label={color}
    />
  );
}

export function ColorSwatchPicker({
  colors,
  value,
  defaultValue,
  onChange,
  swatchSize = 'md',
  swatchShape = 'square',
  disabled = false,
  className,
  ...rest
}: ColorSwatchPickerProps) {
  const [selected, setSelected] = useControlled<string | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onChange as ((v: string | null) => void) | undefined,
  });

  return (
    <RovingFocusGroup
      orientation="both"
      loop
      className={cn('flex flex-wrap gap-1.5', className)}
      {...rest}
    >
      {colors.map((c) => (
        <ColorSwatchItem
          key={c}
          color={c}
          selected={selected === c}
          disabled={disabled}
          size={swatchSize}
          shape={swatchShape}
          onSelect={(color) => setSelected(color)}
        />
      ))}
    </RovingFocusGroup>
  );
}
