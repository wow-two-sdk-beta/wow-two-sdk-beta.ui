export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  type ModalProps,
  type ModalTriggerProps,
  type ModalContentProps,
} from './Modal';

/**
 * @deprecated `Dialog*` was renamed to `Modal*` (overlay role → `*Modal`). These
 * aliases are kept for one release so consumers can migrate; they are removed next.
 */
export {
  Modal as Dialog,
  ModalTrigger as DialogTrigger,
  ModalContent as DialogContent,
  ModalHeader as DialogHeader,
  ModalTitle as DialogTitle,
  ModalDescription as DialogDescription,
  ModalBody as DialogBody,
  ModalFooter as DialogFooter,
  ModalClose as DialogClose,
  type ModalProps as DialogProps,
  type ModalTriggerProps as DialogTriggerProps,
  type ModalContentProps as DialogContentProps,
} from './Modal';
