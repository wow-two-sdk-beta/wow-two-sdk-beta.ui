import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Check } from 'lucide-react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { RovingFocusGroup, useRovingFocusItem } from '../../primitives';

interface StepperContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
  baseId: string;
  registerStep: (value: string) => void;
  unregisterStep: (value: string) => void;
  stepsRef: React.MutableRefObject<string[]>;
}

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepperContext() {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error('Stepper.* must be used inside <Stepper>');
  return ctx;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  {
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    className,
    children,
    ...rest
  },
  ref,
) {
  const [active, setActive] = useControlled<string>({
    controlled: value,
    default: defaultValue ?? '',
    onChange: onValueChange,
  });
  const baseId = useId();
  const stepsRef = useRef<string[]>([]);

  const registerStep = useCallback((v: string) => {
    if (!stepsRef.current.includes(v)) stepsRef.current.push(v);
  }, []);
  const unregisterStep = useCallback((v: string) => {
    stepsRef.current = stepsRef.current.filter((x) => x !== v);
  }, []);

  const ctx = useMemo<StepperContextValue>(
    () => ({
      value: active,
      setValue: setActive,
      orientation,
      baseId,
      registerStep,
      unregisterStep,
      stepsRef,
    }),
    [active, setActive, orientation, baseId, registerStep, unregisterStep],
  );

  return (
    <StepperContext.Provider value={ctx}>
      <div
        ref={ref}
        data-orientation={orientation}
        className={cn(
          orientation === 'vertical' ? 'flex gap-4' : 'flex flex-col gap-4',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
});

export interface StepperListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const StepperList = forwardRef<HTMLDivElement, StepperListProps>(function StepperList(
  { className, children, ...rest },
  ref,
) {
  const ctx = useStepperContext();
  return (
    <RovingFocusGroup
      ref={ref as never}
      orientation={ctx.orientation}
      role="tablist"
      aria-orientation={ctx.orientation}
      data-orientation={ctx.orientation}
      className={cn(
        'flex',
        ctx.orientation === 'vertical' ? 'flex-col gap-4' : 'flex-row items-center gap-2',
        className,
      )}
      {...rest}
    >
      {children}
    </RovingFocusGroup>
  );
});

export interface StepperStepProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  description?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

export const StepperStep = forwardRef<HTMLButtonElement, StepperStepProps>(function StepperStep(
  { value, description, disabled = false, className, onClick, children, ...rest },
  ref,
) {
  const ctx = useStepperContext();
  const roving = useRovingFocusItem();

  useEffect(() => {
    ctx.registerStep(value);
    return () => ctx.unregisterStep(value);
  }, [ctx, value]);

  const ordered = ctx.stepsRef.current;
  const idx = ordered.indexOf(value);
  const activeIdx = ordered.indexOf(ctx.value);
  const status: 'pending' | 'active' | 'complete' =
    idx < activeIdx ? 'complete' : idx === activeIdx ? 'active' : 'pending';

  const stepId = `${ctx.baseId}-step-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;
  const stepNumber = idx + 1;

  return (
    <div className="flex flex-1 items-center gap-2">
      <button
        ref={(node) => {
          roving.ref(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={stepId}
        type="button"
        role="tab"
        aria-selected={status === 'active'}
        aria-controls={panelId}
        aria-current={status === 'active' ? 'step' : undefined}
        data-status={status}
        data-disabled={dataAttr(disabled)}
        tabIndex={roving.tabIndex}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || disabled) return;
          ctx.setValue(value);
        }}
        onFocus={roving.onFocus}
        onKeyDown={roving.onKeyDown}
        className={cn(
          'group flex items-center gap-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-colors',
            status === 'pending' && 'border-border text-muted-foreground',
            status === 'active' && 'border-primary bg-primary text-primary-foreground',
            status === 'complete' && 'border-primary bg-primary text-primary-foreground',
          )}
        >
          {status === 'complete' ? <Check className="h-4 w-4" /> : stepNumber}
        </span>
        <span className="flex flex-col">
          <span
            className={cn(
              'font-medium',
              status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {children}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </span>
      </button>
      {ctx.orientation === 'horizontal' && idx < ordered.length - 1 && (
        <span
          aria-hidden="true"
          className={cn(
            'h-px flex-1 transition-colors',
            status === 'pending' ? 'bg-border' : 'bg-primary',
          )}
        />
      )}
    </div>
  );
});

export interface StepperPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export const StepperPanel = forwardRef<HTMLDivElement, StepperPanelProps>(function StepperPanel(
  { value, className, children, ...rest },
  ref,
) {
  const ctx = useStepperContext();
  if (ctx.value !== value) return null;
  const stepId = `${ctx.baseId}-step-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;
  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={stepId}
      tabIndex={0}
      className={cn('flex-1 outline-none', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

type StepperComponent = typeof Stepper & {
  List: typeof StepperList;
  Step: typeof StepperStep;
  Panel: typeof StepperPanel;
};

(Stepper as StepperComponent).List = StepperList;
(Stepper as StepperComponent).Step = StepperStep;
(Stepper as StepperComponent).Panel = StepperPanel;

export default Stepper as StepperComponent;
