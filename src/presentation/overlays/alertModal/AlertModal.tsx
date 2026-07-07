import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  ModalClose,
  type ModalProps,
  type ModalContentProps,
} from '../modal';

export type AlertModalProps = Omit<ModalProps, 'role' | 'dismissOnOutsideClick'>;

function AlertModalRoot(props: AlertModalProps) {
  return <Modal {...props} role="alertdialog" dismissOnOutsideClick={false} />;
}
AlertModalRoot.displayName = 'AlertModal';

export const AlertModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  function AlertModalContent(props, ref) {
    return <ModalContent ref={ref} {...props} />;
  },
);

export interface AlertModalActionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Fires when the action is confirmed, before the dialog closes. */
  onAction?: () => void;
  children: ReactNode;
}

export const AlertModalAction = forwardRef<HTMLButtonElement, AlertModalActionProps>(
  function AlertModalAction({ onAction, onClick, className, children, ...rest }, ref) {
    return (
      <ModalClose
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
      </ModalClose>
    );
  },
);

export interface AlertModalCancelProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export const AlertModalCancel = forwardRef<HTMLButtonElement, AlertModalCancelProps>(
  function AlertModalCancel({ className, children, ...rest }, ref) {
    return (
      <ModalClose
        ref={ref}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </ModalClose>
    );
  },
);

export const AlertModal = Object.assign(AlertModalRoot, {
  Trigger: ModalTrigger,
  Content: AlertModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Action: AlertModalAction,
  Cancel: AlertModalCancel,
});

export default AlertModal;
