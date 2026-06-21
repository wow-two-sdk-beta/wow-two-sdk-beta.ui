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
  onValueChange?: (hex: string) => void;
  hasAlpha?: boolean;
  presets?: string[];
  triggerSize?: ColorSwatchVariants['size'];
  isDisabled?: boolean;
  name?: string;
  className?: string;
  'aria-label'?: string;
}

const FALLBACK_HSV: HSV = { h: 217, s: 0.91, v: 0.96, a: 1 };

export const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
  {
    value,
    defaultValue = '#3b82f6',
    onValueChange,
    hasAlpha = false,
    presets,
    triggerSize = 'md',
    isDisabled = false,
    name,
    className,
    'aria-label': ariaLabel = 'Pick a color',
  },
  ref,
) {
  const [hex, setHex] = useControlled<string | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange as ((v: string | null) => void) | undefined,
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
    const currentHex = hsvToHex(hsv, { withAlpha: hasAlpha });
    if (currentHex.toLowerCase() !== hex.toLowerCase()) {
      setHsvState({ ...parsed, a: hsv.a });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex, hasAlpha]);

  const updateHsv = (next: HSV) => {
    setHsvState(next);
    setHex(hsvToHex(next, { withAlpha: hasAlpha }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          aria-label={ariaLabel}
          disabled={isDisabled}
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
          onValueChange={({ saturation, value }) => updateHsv({ ...hsv, s: saturation, v: value })}
        />
        <ColorSlider
          channel="hue"
          value={hsv.h}
          onValueChange={(h) => updateHsv({ ...hsv, h })}
          aria-label="Hue"
        />
        {hasAlpha && (
          <ColorSlider
            channel="alpha"
            value={hsv.a ?? 1}
            color={hsv}
            onValueChange={(a) => updateHsv({ ...hsv, a })}
            aria-label="Alpha"
          />
        )}
        <ColorField
          value={hex}
          onValueChange={(next) => setHex(next)}
          hasAlpha={hasAlpha}
        />
        {presets && presets.length > 0 && (
          <ColorSwatchPicker
            colors={presets}
            value={hex}
            onValueChange={setHex}
            swatchSize="sm"
          />
        )}
      </PopoverContent>
      {name && <input type="hidden" name={name} value={hex ?? ''} />}
    </Popover>
  );
});
