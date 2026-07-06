import { forwardRef, useEffect, useState, type ReactNode, type Ref } from 'react';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
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
  /**
   * Which built-in trigger to render (ignored when `trigger` is set):
   * - `full` *(default)* — swatch + hex-value text, framed button.
   * - `swatch` — a bare interactive swatch, no text (compact toolbars, tiles).
   * - `value` — hex-value text only, no swatch (dense / code contexts).
   */
  triggerVariant?: 'full' | 'swatch' | 'value';
  isDisabled?: boolean;
  name?: string;
  className?: string;
  'aria-label'?: string;
  /** Custom trigger element; when set, replaces the default swatch + hex-value button. Must be a single focusable element (it becomes the popover trigger via `asChild`). */
  trigger?: ReactNode;
}

const FALLBACK_HSV: HSV = { h: 217, s: 0.91, v: 0.96, a: 1 };

// The swatch trigger's real open handler is composed on by Popover's `asChild`
// Slot; ColorSwatch only needs a truthy `onClick` to render as a <button>.
const NOOP = () => {};

export const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker(
  {
    value,
    defaultValue = '#3b82f6',
    onValueChange,
    hasAlpha = false,
    presets,
    triggerSize = 'md',
    triggerVariant = 'full',
    isDisabled = false,
    name,
    className,
    'aria-label': ariaLabel = 'Pick a color',
    trigger,
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
        {trigger ??
          (triggerVariant === 'swatch' ? (
            // Bare interactive swatch — ColorSwatch is a real <button> here (given onClick),
            // so it becomes the popover trigger via Slot with no wrapper chrome.
            <ColorSwatch
              ref={ref as Ref<HTMLElement>}
              color={hex ?? '#00000000'}
              size={triggerSize}
              onClick={NOOP}
              aria-label={ariaLabel}
              isDisabled={isDisabled}
              className={className}
            />
          ) : (
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
              {triggerVariant === 'full' && <ColorSwatch color={hex ?? '#00000000'} size={triggerSize} />}
              <span className="font-mono uppercase">{hex ?? '—'}</span>
            </button>
          ))}
      </PopoverTrigger>
      <PopoverContent aria-label="Color picker" className="flex w-64 flex-col gap-3">
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
          aria-label="Hex color"
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
