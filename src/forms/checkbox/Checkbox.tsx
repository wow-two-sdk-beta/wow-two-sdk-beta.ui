import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn, CssExtensions, type SizePreset, type SizeUnion } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { checkboxVariants, type CheckboxVariants } from './Checkbox.variants';

const COMPONENT_NAME = 'Checkbox';

/* Checkbox supports the 5-preset core (skips `2xl` — outsized for a form control). */
type CheckboxSizePreset = Extract<SizePreset, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
const CHECKBOX_SIZE_PRESETS: ReadonlySet<string> = new Set<CheckboxSizePreset>([
  'xs', 'sm', 'md', 'lg', 'xl',
]);

/* Outer wrapper box dim per preset. */
const BOX_SIZE_CLASS: Record<CheckboxSizePreset, string> = {
  xs: 'h-3.5 w-3.5',  // 14px — dense / mobile-tight (consumer must ensure ≥24px hit target via wrapping label)
  sm: 'h-4 w-4',      // 16px
  md: 'h-5 w-5',      // 20px (default)
  lg: 'h-6 w-6',      // 24px (WCAG-compliant standalone)
  xl: 'h-7 w-7',      // 28px (emphasis / a11y-first)
};

/* Inner icon dim per preset — scales proportionally to box. */
const ICON_SIZE_CLASS: Record<CheckboxSizePreset, string> = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
};

/* Fallback icon dim when raw/object size used — middle of scale. */
const DEFAULT_ICON_CLASS = 'h-3 w-3';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    CheckboxVariants {
  /* Size: preset (`xs|sm|md|lg|xl`) → box + icon scale · raw number/string → square inline · object → explicit dims. See `SizeUnion`. */
  size?: SizeUnion<CheckboxSizePreset>;

  /* Tristate visual — input stays `checked={false}` but renders as a dash with the same checked-state styling. */
  indeterminate?: boolean;
}

/* When indeterminate=true, apply the compound's checked classes regardless of peer-checked state. */
const INDETERMINATE_CHECKED_CLASS: Record<
  NonNullable<CheckboxVariants['variant']>,
  Record<NonNullable<CheckboxVariants['tone']>, string>
> = {
  solid: {
    primary: 'bg-primary border-primary text-primary-foreground',
    neutral: 'bg-foreground border-foreground text-background',
    danger:  'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-success border-success text-success-foreground',
    warning: 'bg-warning border-warning text-warning-foreground',
  },
  soft: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger:  'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  outline: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger:  'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  ghost: {
    primary: 'bg-primary/10 text-primary',
    neutral: 'bg-muted text-foreground',
    danger:  'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  },
  /* Glass family keeps dark glass bg in indeterminate state (matches checked behavior). The Minus icon renders unconditionally; text-white from variant base makes it visible. */
  glass: {
    primary: 'text-white',
    neutral: 'text-white',
    danger:  'text-white',
    success: 'text-white',
    warning: 'text-white',
  },
  'glass-surface': {
    primary: 'text-white border-white/80',
    neutral: 'text-white border-white/80',
    danger:  'text-white border-white/80',
    success: 'text-white border-white/80',
    warning: 'text-white border-white/80',
  },
};

/* Native checkbox with custom visual. Renders the input visually hidden but accessible — wrap in a `<label>` (or pair with `Label` via `FormControl`). Supports 6 variants × 5 tones matrix + indeterminate. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      indeterminate,
      variant = 'solid',
      tone = 'primary',
      id,
      disabled,
      required,
      checked,
      ...props
    },
    ref,
  ) => {
    const ctx = useFormControl();
    const isDisabled = disabled ?? ctx?.isDisabled;

    /* Parse union-typed `size` — preset routes to box+icon class lookup, raw/object routes to inline dims. */
    const { preset: sizePreset, box: sizeBox } = CssExtensions.parseSizeUnion<CheckboxSizePreset>(
      size,
      CHECKBOX_SIZE_PRESETS,
    );
    const boxClass = sizePreset ? BOX_SIZE_CLASS[sizePreset] : undefined;
    const iconClass = sizePreset ? ICON_SIZE_CLASS[sizePreset] : DEFAULT_ICON_CLASS;
    const boxStyle = sizeBox ? CssExtensions.resolveBoxSize(sizeBox) : undefined;

    return (
      <span
        className={cn('relative inline-flex shrink-0', boxClass, className)}
        style={boxStyle}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id ?? ctx?.id}
          disabled={isDisabled}
          required={required ?? ctx?.isRequired}
          checked={checked}
          aria-invalid={ctx?.isInvalid || undefined}
          aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
          className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            checkboxVariants({ variant, tone }),
            indeterminate && INDETERMINATE_CHECKED_CLASS[variant][tone],
          )}
        >
          {indeterminate ? (
            <Minus className={iconClass} />
          ) : (
            <Check className={cn(iconClass, 'opacity-0 peer-checked:opacity-100')} />
          )}
        </span>
      </span>
    );
  },
);

Checkbox.displayName = COMPONENT_NAME;
