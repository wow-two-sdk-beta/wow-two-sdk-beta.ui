import { forwardRef, useEffect, useState } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import {
  hsvToHex,
  parseColorToHsv,
  type HSV,
} from '../ColorExtensions';
import { ColorSwatch, type ColorSwatchVariants } from '../colorSwatch';
import { ColorArea } from '../colorArea';
import { ColorSlider } from '../colorSlider';
import { ColorField } from '../colorField';
import { ColorSwatchPicker } from '../colorSwatchPicker';

export interface ColorPickerProps {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (hex: string) => void;
  withAlpha?: boolean;
  presets?: string[];
  triggerSize?: ColorSwatchVariants['size'];
  disabled?: boolean;
  name?: string;
  className?: string;
  'aria-label'?: string;
}

const FALLBACK_HSV: HSV = { h: 217, s: 0.91, v: 0.96, a: 1 };

export const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
  {
    value,
    defaultValue = '#3b82f6',
    onChange,
    withAlpha = false,
    presets,
    triggerSize = 'md',
    disabled = false,
    name,
    className,
    'aria-label': ariaLabel = 'Pick a color',
  },
  ref,
) {
  const [hex, setHex] = useControlled<string | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onChange as ((v: string | null) => void) | undefined,
  });

  // Internal HSV state (kept in sync with hex). HSV preserves picker geometry
  // when the user moves to a fully-desaturated value (otherwise hue collapses).
  const [hsv, setHsvState] = useState<HSV>(() => parseColorToHsv(hex) ?? FALLBACK_HSV);

  useEffect(() => {
    if (!hex) return;
    const parsed = parseColorToHsv(hex);
    if (!parsed) return;
    // Only update internal HSV if the *committed* hex differs from what our
    // HSV currently produces — avoids hue collapsing when SV passes through 0.
    const currentHex = hsvToHex(hsv, { withAlpha });
    if (currentHex.toLowerCase() !== hex.toLowerCase()) {
      setHsvState({ ...parsed, a: hsv.a });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex, withAlpha]);

  const updateHsv = (next: HSV) => {
    setHsvState(next);
    setHex(hsvToHex(next, { withAlpha }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
        >
          <ColorSwatch color={hex ?? '#00000000'} size={triggerSize} />
          <span className="font-mono uppercase">{hex ?? '—'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-64 flex-col gap-3">
        <ColorArea
          hue={hsv.h}
          saturation={hsv.s}
          value={hsv.v}
          onChange={({ saturation, value }) => updateHsv({ ...hsv, s: saturation, v: value })}
        />
        <ColorSlider
          channel="hue"
          value={hsv.h}
          onChange={(h) => updateHsv({ ...hsv, h })}
          aria-label="Hue"
        />
        {withAlpha && (
          <ColorSlider
            channel="alpha"
            value={hsv.a ?? 1}
            color={hsv}
            onChange={(a) => updateHsv({ ...hsv, a })}
            aria-label="Alpha"
          />
        )}
        <ColorField
          value={hex}
          onChange={(next) => setHex(next)}
          withAlpha={withAlpha}
        />
        {presets && presets.length > 0 && (
          <ColorSwatchPicker
            colors={presets}
            value={hex}
            onChange={setHex}
            swatchSize="sm"
          />
        )}
      </PopoverContent>
      {name && <input type="hidden" name={name} value={hex ?? ''} />}
    </Popover>
  );
});
