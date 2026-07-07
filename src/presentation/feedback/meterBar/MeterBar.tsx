import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, Size } from '../../../foundation/utils';

export interface MeterBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The current value 0–`max`. */
  value: number;
  max?: number;
  /** The threshold values that change the fill tone. Pass `[good, warn]` —
   *  `value <= good` → success, `<= warn` → warning, otherwise destructive.
   *  Defaults: `[max * 0.7, max * 0.9]`. */
  thresholds?: [number, number];

  /** The bar thickness. */
  size?: Size;
  label?: string;
}

/* Only the sm/md/lg steps carry a thickness; other `Size` members fall through
   to the `md` default at the lookup below. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

/**
 * Like `ProgressBar` but the fill color reflects threshold zones — green /
 * amber / red. Use for usage gauges, capacity, score meters.
 */
export const MeterBar = forwardRef<HTMLDivElement, MeterBarProps>(
  ({ value, max = 100, thresholds, size = Size.Md, label, className, ...props }, ref) => {
    const [good, warn] = thresholds ?? [max * 0.7, max * 0.9];
    const tone =
      value <= good ? 'bg-success' : value <= warn ? 'bg-warning' : 'bg-destructive';
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div
        ref={ref}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn('w-full overflow-hidden rounded-full bg-muted', SIZE[size] ?? SIZE.md, className)}
        {...props}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  },
);
MeterBar.displayName = 'MeterBar';
