import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '../drawer';

interface ActionSheetContextValue {
  setOpen: (open: boolean) => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

function useActionSheetContext() {
  const ctx = useContext(ActionSheetContext);
  if (!ctx) throw new Error('ActionSheet.* must be used inside <ActionSheet>');
  return ctx;
}

export interface ActionSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * iOS-style action sheet — opinionated bottom Drawer with stacked button rows
 * and a separated Cancel.
 */
export function ActionSheet({
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  className,
  children,
}: ActionSheetProps) {
  // We can't intercept `setOpen` from Drawer's context directly, so the
  // ActionSheet wraps Drawer with our own controlled bridge.
  const handleOpenChange = (next: boolean) => onOpenChange?.(next);

  const ctx = useMemo<ActionSheetContextValue>(
    () => ({ setOpen: handleOpenChange }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpenChange],
  );

  return (
    <ActionSheetContext.Provider value={ctx}>
      <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} side="bottom">
        <DrawerContent
          className={cn(
            'mx-auto max-w-md rounded-t-xl bg-card p-2 text-card-foreground',
            className,
          )}
        >
          {(title || description) && (
            <div className="px-3 py-2 text-center">
              {title && (
                <DrawerTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </DrawerTitle>
              )}
              {description && (
                <DrawerDescription className="mt-1 text-xs text-muted-foreground">
                  {description}
                </DrawerDescription>
              )}
            </div>
          )}
          <div className="flex flex-col gap-px overflow-hidden rounded-lg bg-border">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    </ActionSheetContext.Provider>
  );
}

export interface ActionSheetActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void;
  destructive?: boolean;
}

export const ActionSheetAction = forwardRef<HTMLButtonElement, ActionSheetActionProps>(
  function ActionSheetAction(
    { className, onSelect, destructive, onClick, children, type = 'button', ...rest },
    ref,
  ) {
    const ctx = useActionSheetContext();
    return (
      <button
        ref={ref}
        type={type}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          onSelect?.();
          ctx.setOpen(false);
        }}
        className={cn(
          'flex h-12 w-full items-center justify-center bg-card px-4 text-base font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          destructive ? 'text-destructive' : 'text-foreground',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

export type ActionSheetCancelProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const ActionSheetCancel = forwardRef<HTMLButtonElement, ActionSheetCancelProps>(
  function ActionSheetCancel({ className, onClick, children = 'Cancel', type = 'button', ...rest }, ref) {
    const ctx = useActionSheetContext();
    return (
      <button
        ref={ref}
        type={type}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.setOpen(false);
        }}
        className={cn(
          'mt-2 flex h-12 w-full items-center justify-center rounded-lg bg-card text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

type ActionSheetComponent = typeof ActionSheet & {
  Action: typeof ActionSheetAction;
  Cancel: typeof ActionSheetCancel;
};

(ActionSheet as ActionSheetComponent).Action = ActionSheetAction;
(ActionSheet as ActionSheetComponent).Cancel = ActionSheetCancel;

export default ActionSheet as ActionSheetComponent;
