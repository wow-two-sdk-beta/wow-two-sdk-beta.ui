import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

interface OnboardingContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export interface OnboardingChecklistProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  defaultOpen?: boolean;
  dismissOnComplete?: boolean;
  /** ms after 100% before unmounting. */
  dismissDelay?: number;
  onDismiss?: () => void;
  children: ReactNode;
}

/**
 * Onboarding task card. Children are `OnboardingChecklist.Task` elements;
 * progress is auto-derived from their `done` props.
 */
export const OnboardingChecklist = forwardRef<HTMLDivElement, OnboardingChecklistProps>(
  function OnboardingChecklist(
    {
      title = 'Get started',
      defaultOpen = true,
      dismissOnComplete = false,
      dismissDelay = 2000,
      onDismiss,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const [open, setOpen] = useState(defaultOpen);
    const [dismissed, setDismissed] = useState(false);

    const tasks = Children.toArray(children).filter(
      (c): c is React.ReactElement<OnboardingChecklistTaskProps> =>
        isValidElement(c) &&
        (c.type as { displayName?: string }).displayName === 'OnboardingChecklistTask',
    );
    const total = tasks.length;
    const done = tasks.filter((t) => t.props.done).length;
    const complete = total > 0 && done === total;

    useEffect(() => {
      if (!dismissOnComplete || !complete || dismissed) return;
      const handle = window.setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, dismissDelay);
      return () => window.clearTimeout(handle);
    }, [complete, dismissOnComplete, dismissDelay, dismissed, onDismiss]);

    const ctx = useMemo<OnboardingContextValue>(() => ({ open, setOpen }), [open]);

    if (dismissed) return null;

    return (
      <OnboardingContext.Provider value={ctx}>
        <div
          ref={ref}
          className={cn(
            'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
            className,
          )}
          {...rest}
        >
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {done} of {total} tasks complete
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    'h-full bg-primary transition-[width] duration-300',
                    complete && 'bg-success',
                  )}
                  style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
                />
              </div>
            </div>
            <Icon
              icon={ChevronDown}
              size={16}
              className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
            />
          </button>
          {open && (
            <ul role="list" className="border-t border-border">
              {children}
            </ul>
          )}
        </div>
      </OnboardingContext.Provider>
    );
  },
);

export interface OnboardingChecklistTaskProps extends HTMLAttributes<HTMLLIElement> {
  label: ReactNode;
  description?: ReactNode;
  done?: boolean;
  action?: ReactNode;
}

export const OnboardingChecklistTask = forwardRef<
  HTMLLIElement,
  OnboardingChecklistTaskProps
>(function OnboardingChecklistTask(
  { label, description, done = false, action, className, ...rest },
  ref,
) {
  return (
    <li
      ref={ref}
      data-done={done || undefined}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors',
        done && 'opacity-60',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border',
          done ? 'border-success bg-success text-success-foreground' : 'border-border',
        )}
      >
        {done && <Icon icon={Check} size={12} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-medium text-foreground', done && 'line-through')}>
          {label}
        </div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      {action && !done && <div className="shrink-0">{action}</div>}
    </li>
  );
});
OnboardingChecklistTask.displayName = 'OnboardingChecklistTask';

type OnboardingChecklistComponent = typeof OnboardingChecklist & {
  Task: typeof OnboardingChecklistTask;
};

(OnboardingChecklist as OnboardingChecklistComponent).Task = OnboardingChecklistTask;

export function useOnboardingChecklist() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingChecklist must be used inside <OnboardingChecklist>');
  return ctx;
}

export default OnboardingChecklist as OnboardingChecklistComponent;
