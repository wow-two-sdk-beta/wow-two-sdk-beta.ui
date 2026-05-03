import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  type DialogProps,
  type DialogContentProps,
} from '../dialog';

export type AlertDialogProps = Omit<DialogProps, 'role' | 'dismissOnOutsideClick'>;

export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} role="alertdialog" dismissOnOutsideClick={false} />;
}

export const AlertDialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function AlertDialogContent(props, ref) {
    return <DialogContent ref={ref} {...props} />;
  },
);

export interface AlertDialogActionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Runs before the dialog closes. */
  onAction?: () => void;
  children: ReactNode;
}

export const AlertDialogAction = forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  function AlertDialogAction({ onAction, onClick, className, children, ...rest }, ref) {
    return (
      <DialogClose
        ref={ref}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          onAction?.();
        }}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </DialogClose>
    );
  },
);

export interface AlertDialogCancelProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export const AlertDialogCancel = forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  function AlertDialogCancel({ className, children, ...rest }, ref) {
    return (
      <DialogClose
        ref={ref}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </DialogClose>
    );
  },
);

type AlertDialogComponent = typeof AlertDialog & {
  Trigger: typeof DialogTrigger;
  Content: typeof AlertDialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Action: typeof AlertDialogAction;
  Cancel: typeof AlertDialogCancel;
};

(AlertDialog as AlertDialogComponent).Trigger = DialogTrigger;
(AlertDialog as AlertDialogComponent).Content = AlertDialogContent;
(AlertDialog as AlertDialogComponent).Header = DialogHeader;
(AlertDialog as AlertDialogComponent).Title = DialogTitle;
(AlertDialog as AlertDialogComponent).Description = DialogDescription;
(AlertDialog as AlertDialogComponent).Body = DialogBody;
(AlertDialog as AlertDialogComponent).Footer = DialogFooter;
(AlertDialog as AlertDialogComponent).Action = AlertDialogAction;
(AlertDialog as AlertDialogComponent).Cancel = AlertDialogCancel;

export default AlertDialog as AlertDialogComponent;
