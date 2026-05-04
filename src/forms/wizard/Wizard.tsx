import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';

interface StepInfo {
  id: string;
  label?: ReactNode;
  optional?: boolean;
  final?: boolean;
}

interface WizardContextValue {
  steps: StepInfo[];
  currentIndex: number;
  currentStep: StepInfo | undefined;
  goTo: (idOrIndex: string | number) => void;
  next: () => Promise<void>;
  back: () => void;
  canGoBack: boolean;
  visited: Set<string>;
  registerStep: (info: StepInfo) => void;
  unregisterStep: (id: string) => void;
  registerValidator: (id: string, validator: () => boolean | Promise<boolean>) => void;
  unregisterValidator: (id: string) => void;
  isPending: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside <Wizard>');
  return ctx;
}

export interface WizardProps extends HTMLAttributes<HTMLDivElement> {
  currentStep?: string;
  defaultCurrentStep?: string;
  onStepChange?: (step: string) => void;
  onComplete?: () => void | Promise<void>;
  canGoBack?: boolean;
  children: ReactNode;
}

export const Wizard = forwardRef<HTMLDivElement, WizardProps>(function Wizard(
  {
    currentStep: currentStepProp,
    defaultCurrentStep,
    onStepChange,
    onComplete,
    canGoBack = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  // Pre-walk children to discover step ids (so context can default to first id).
  const childArray = Children.toArray(children).filter(isValidElement);
  const stepFromChildren: StepInfo[] = childArray
    .filter(
      (c) =>
        (c.type as { displayName?: string }).displayName === 'WizardStep',
    )
    .map((c) => {
      const props = c.props as WizardStepProps;
      return {
        id: props.id,
        label: props.label,
        optional: props.optional,
        final: props.final,
      };
    });

  const [steps, setSteps] = useState<StepInfo[]>(stepFromChildren);
  const validatorsRef = useState(() => new Map<string, () => boolean | Promise<boolean>>())[0];

  const initialStep = stepFromChildren[0]?.id ?? '';
  const [currentStepId, setCurrentStepId] = useControlled<string>({
    controlled: currentStepProp,
    default: defaultCurrentStep ?? initialStep,
    onChange: onStepChange,
  });

  const [visited, setVisited] = useState<Set<string>>(() => new Set([initialStep]));
  const [isPending, setIsPending] = useState(false);

  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const currentStep = steps[currentIndex];

  const registerStep = useCallback((info: StepInfo) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === info.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = info;
        return next;
      }
      return [...prev, info];
    });
  }, []);

  const unregisterStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const registerValidator = useCallback(
    (id: string, validator: () => boolean | Promise<boolean>) => {
      validatorsRef.set(id, validator);
    },
    [validatorsRef],
  );

  const unregisterValidator = useCallback(
    (id: string) => {
      validatorsRef.delete(id);
    },
    [validatorsRef],
  );

  const goTo = useCallback(
    (idOrIndex: string | number) => {
      const target =
        typeof idOrIndex === 'number' ? steps[idOrIndex]?.id : idOrIndex;
      if (!target) return;
      setCurrentStepId(target);
      setVisited((prev) => new Set([...prev, target]));
    },
    [steps, setCurrentStepId],
  );

  const next = useCallback(async () => {
    if (!currentStep || isPending) return;
    const validator = validatorsRef.get(currentStep.id);
    if (validator) {
      setIsPending(true);
      try {
        const ok = await validator();
        if (!ok) return;
      } finally {
        setIsPending(false);
      }
    }
    if (currentStep.final) {
      setIsPending(true);
      try {
        await onComplete?.();
      } finally {
        setIsPending(false);
      }
      return;
    }
    const nextStep = steps[currentIndex + 1];
    if (nextStep) goTo(nextStep.id);
  }, [currentStep, currentIndex, steps, isPending, onComplete, validatorsRef, goTo]);

  const back = useCallback(() => {
    if (!canGoBack) return;
    const prev = steps[currentIndex - 1];
    if (prev) goTo(prev.id);
  }, [canGoBack, currentIndex, steps, goTo]);

  const ctx = useMemo<WizardContextValue>(
    () => ({
      steps,
      currentIndex,
      currentStep,
      goTo,
      next,
      back,
      canGoBack,
      visited,
      registerStep,
      unregisterStep,
      registerValidator,
      unregisterValidator,
      isPending,
    }),
    [
      steps,
      currentIndex,
      currentStep,
      goTo,
      next,
      back,
      canGoBack,
      visited,
      registerStep,
      unregisterStep,
      registerValidator,
      unregisterValidator,
      isPending,
    ],
  );

  return (
    <WizardContext.Provider value={ctx}>
      <div ref={ref} className={cn('flex flex-col gap-4', className)} {...rest}>
        {children}
      </div>
    </WizardContext.Provider>
  );
});

export type WizardStepsProps = HTMLAttributes<HTMLDivElement>;

export const WizardSteps = forwardRef<HTMLDivElement, WizardStepsProps>(
  function WizardSteps({ className, ...rest }, ref) {
    const ctx = useWizard();
    return (
      <div
        ref={ref}
        role="tablist"
        aria-label="Wizard steps"
        className={cn('flex items-center gap-2 overflow-x-auto', className)}
        {...rest}
      >
        {ctx.steps.map((step, i) => {
          const isCurrent = ctx.currentIndex === i;
          const wasVisited = ctx.visited.has(step.id);
          const canJump = ctx.canGoBack && wasVisited;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-disabled={!canJump || undefined}
              onClick={() => canJump && ctx.goTo(step.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : wasVisited
                    ? 'bg-muted text-foreground hover:bg-muted/70'
                    : 'text-muted-foreground',
                !canJump && 'cursor-default',
              )}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-[10px]">
                {i + 1}
              </span>
              {step.label ?? step.id}
              {step.optional && <span className="ml-1 text-[10px] opacity-70">(optional)</span>}
            </button>
          );
        })}
      </div>
    );
  },
);

export interface WizardStepProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  label?: ReactNode;
  validate?: () => boolean | Promise<boolean>;
  optional?: boolean;
  final?: boolean;
}

export const WizardStep = forwardRef<HTMLDivElement, WizardStepProps>(function WizardStep(
  { id, label, validate, optional, final, className, children, ...rest },
  ref,
) {
  const ctx = useWizard();
  const isCurrent = ctx.currentStep?.id === id;

  // Register/refresh step metadata.
  useMemo(() => {
    ctx.registerStep({ id, label, optional, final });
    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, label, optional, final]);

  useMemo(() => {
    if (validate) ctx.registerValidator(id, validate);
    else ctx.unregisterValidator(id);
    return validate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, validate]);

  if (!isCurrent) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      aria-labelledby={`wizard-step-${id}`}
      className={cn('flex flex-col gap-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
});
WizardStep.displayName = 'WizardStep';

export interface WizardFooterProps extends HTMLAttributes<HTMLDivElement> {
  prevLabel?: ReactNode;
  nextLabel?: ReactNode;
  submitLabel?: ReactNode;
  /** Render the Prev button when not on first step. Default true. */
  showPrev?: boolean;
}

export const WizardFooter = forwardRef<HTMLDivElement, WizardFooterProps>(
  function WizardFooter(
    {
      prevLabel = 'Back',
      nextLabel = 'Next',
      submitLabel = 'Finish',
      showPrev = true,
      className,
      ...rest
    },
    ref,
  ) {
    const ctx = useWizard();
    const isFirst = ctx.currentIndex === 0;
    const isFinal = ctx.currentStep?.final ?? false;

    return (
      <div
        ref={ref}
        className={cn('mt-2 flex items-center justify-between gap-3', className)}
        {...rest}
      >
        {showPrev && !isFirst && ctx.canGoBack ? (
          <button
            type="button"
            onClick={ctx.back}
            disabled={ctx.isPending}
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {prevLabel}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={ctx.next}
          disabled={ctx.isPending}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {ctx.isPending ? '…' : isFinal ? submitLabel : nextLabel}
        </button>
      </div>
    );
  },
);

type WizardComponent = typeof Wizard & {
  Steps: typeof WizardSteps;
  Step: typeof WizardStep;
  Footer: typeof WizardFooter;
};

(Wizard as WizardComponent).Steps = WizardSteps;
(Wizard as WizardComponent).Step = WizardStep;
(Wizard as WizardComponent).Footer = WizardFooter;

export default Wizard as WizardComponent;
