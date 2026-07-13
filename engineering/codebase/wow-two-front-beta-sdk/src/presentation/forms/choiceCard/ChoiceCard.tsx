import { forwardRef, type ReactNode } from 'react';
import { cn, Size } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Radio, type RadioProps } from '../radio/Radio';

export interface ChoiceCardProps extends Omit<RadioProps, 'children' | 'size'> {
  label: ReactNode;
  description?: ReactNode;
  /** The optional icon rendered above the label. */
  icon?: ReactNode;

  /** The card size. Default `md`. */
  size?: Size;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'p-3 text-xs',
  md: 'p-4 text-sm',
  lg: 'p-5 text-base',
};

/**
 * Radio styled as a clickable card with title + description + optional
 * icon. Common for plan/option pickers. Compose inside `RadioGroup` for
 * mutex selection.
 */
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(
  ({ label, description, icon, size = Size.Md, id, className, ...props }, ref) => {
    const generated = useId();
    // Context id wins over the generated fallback (see CheckboxField) — inside a
    // `Field`/`form.Field` the surrounding Label's `htmlFor` targets `ctx.id`, so
    // the card's radio must carry it. Inside a `RadioGroup` the per-item context
    // supplies a unique id instead.
    const ctx = useFormControl();
    const inputId = id ?? ctx?.id ?? generated;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'group relative block cursor-pointer rounded-lg border border-input bg-card text-card-foreground transition-colors',
          'hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-primary-soft/30',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
          SIZE[size] ?? SIZE.md,
          className,
        )}
      >
        <Radio ref={ref} id={inputId} className="absolute right-3 top-3" {...props} />
        <div className="flex items-start gap-3 pr-7">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">{label}</div>
            {description && <div className="mt-0.5 text-muted-foreground">{description}</div>}
          </div>
        </div>
      </label>
    );
  },
);
ChoiceCard.displayName = 'ChoiceCard';
