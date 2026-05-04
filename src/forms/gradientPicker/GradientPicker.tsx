import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { Plus, Trash } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import { inputBaseVariants } from '../InputStyles';

export type GradientKind = 'linear' | 'radial' | 'conic';

export interface GradientStop {
  color: string;
  position: number;
}

export interface Gradient {
  kind: GradientKind;
  angle: number;
  stops: GradientStop[];
}

export interface GradientPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: Gradient;
  defaultValue?: Gradient;
  onValueChange?: (value: Gradient) => void;
  disabled?: boolean;
  name?: string;
}

const DEFAULT_GRADIENT: Gradient = {
  kind: 'linear',
  angle: 90,
  stops: [
    { color: '#3b82f6', position: 0 },
    { color: '#a855f7', position: 100 },
  ],
};

export function gradientToCss(g: Gradient): string {
  const stops = [...g.stops].sort((a, b) => a.position - b.position);
  const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ');
  if (g.kind === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
  if (g.kind === 'radial') return `radial-gradient(circle, ${stopsStr})`;
  return `conic-gradient(from ${g.angle}deg, ${stopsStr})`;
}

/**
 * Visual gradient editor — kind / angle / stops. Output `Gradient` object via
 * `onValueChange`; `name` emits the CSS string for forms.
 */
export const GradientPicker = forwardRef<HTMLDivElement, GradientPickerProps>(
  function GradientPicker(
    { value: valueProp, defaultValue, onValueChange, disabled, name, className, ...rest },
    ref,
  ) {
    const [gradient, setGradient] = useControlled({
      controlled: valueProp,
      default: defaultValue ?? DEFAULT_GRADIENT,
      onChange: onValueChange,
    });

    const css = useMemo(() => gradientToCss(gradient), [gradient]);

    const update = (patch: Partial<Gradient>) => setGradient({ ...gradient, ...patch });
    const updateStop = (i: number, patch: Partial<GradientStop>) =>
      setGradient({
        ...gradient,
        stops: gradient.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
      });
    const addStop = () => {
      const last = gradient.stops[gradient.stops.length - 1];
      const newPos = last ? Math.min(100, last.position + 25) : 50;
      setGradient({
        ...gradient,
        stops: [...gradient.stops, { color: '#ffffff', position: newPos }],
      });
    };
    const removeStop = (i: number) => {
      if (gradient.stops.length <= 2) return;
      setGradient({ ...gradient, stops: gradient.stops.filter((_, idx) => idx !== i) });
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm',
          disabled && 'opacity-60',
          className,
        )}
        {...rest}
      >
        {/* Kind + angle */}
        <div className="flex items-center gap-2 text-sm">
          <div role="radiogroup" aria-label="Gradient kind" className="flex items-center gap-0.5 rounded-md bg-muted/40 p-0.5 ring-1 ring-border">
            {(['linear', 'radial', 'conic'] as GradientKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={gradient.kind === k}
                disabled={disabled}
                onClick={() => update({ kind: k })}
                className={cn(
                  'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
                  gradient.kind === k
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {k}
              </button>
            ))}
          </div>
          {gradient.kind !== 'radial' && (
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Angle
              <input
                type="number"
                min={0}
                max={360}
                value={gradient.angle}
                disabled={disabled}
                onChange={(e) => update({ angle: Math.max(0, Math.min(360, Number(e.target.value) || 0)) })}
                className={cn(inputBaseVariants({ size: 'sm' }), 'w-20')}
              />
              °
            </label>
          )}
        </div>

        {/* Preview bar */}
        <div
          aria-hidden="true"
          className="h-12 rounded-md border border-border"
          style={{ background: css }}
        />

        {/* Stops */}
        <ul className="flex flex-col gap-2">
          {gradient.stops.map((stop, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                disabled={disabled}
                onChange={(e) => updateStop(i, { color: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded-sm border border-input bg-background"
              />
              <input
                type="text"
                value={stop.color}
                disabled={disabled}
                onChange={(e) => updateStop(i, { color: e.target.value })}
                className={cn(inputBaseVariants({ size: 'sm' }), 'flex-1 font-mono')}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={stop.position}
                disabled={disabled}
                onChange={(e) => updateStop(i, { position: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                className={cn(inputBaseVariants({ size: 'sm' }), 'w-16')}
              />
              <span className="text-xs text-muted-foreground">%</span>
              <button
                type="button"
                aria-label="Remove stop"
                disabled={disabled || gradient.stops.length <= 2}
                onClick={() => removeStop(i)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive-soft disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon icon={Trash} size={12} />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={disabled}
          onClick={addStop}
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={Plus} size={12} /> Add stop
        </button>

        {/* CSS output */}
        <code className="block break-all rounded-md bg-muted/40 px-2 py-1.5 text-[10px] text-muted-foreground">
          {css}
        </code>
        {name && <input type="hidden" name={name} value={css} />}
      </div>
    );
  },
);
