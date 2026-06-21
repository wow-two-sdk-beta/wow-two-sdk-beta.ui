import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Check, X } from 'lucide-react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

interface EditableContextValue {
  value: string;
  draft: string;
  setDraft: (v: string) => void;
  isEditing: boolean;
  setEditing: (open: boolean) => void;
  submit: () => void;
  cancel: () => void;
  placeholder: string;
  isDisabled: boolean;
  isReadOnly: boolean;
  canSubmitOnBlur: boolean;
  canSubmitOnEnter: boolean;
  canCancelOnEscape: boolean;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}

const EditableContext = createContext<EditableContextValue | null>(null);

function useEditableContext() {
  const ctx = useContext(EditableContext);
  if (!ctx) throw new Error('Editable.* must be used inside <Editable>');
  return ctx;
}

export interface EditableProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  isEditing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  placeholder?: string;
  canSubmitOnBlur?: boolean;
  canSubmitOnEnter?: boolean;
  canCancelOnEscape?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  name?: string;
  className?: string;
  children: ReactNode;
}

export function Editable({
  value: valueProp,
  defaultValue,
  onValueChange,
  isEditing: editingProp,
  defaultEditing = false,
  onEditingChange,
  placeholder = 'Click to edit',
  canSubmitOnBlur = true,
  canSubmitOnEnter = true,
  canCancelOnEscape = true,
  isDisabled = false,
  isReadOnly = false,
  name,
  className,
  children,
}: EditableProps) {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? '',
    onChange: onValueChange,
  });
  const [editing, setEditing] = useControlled({
    controlled: editingProp,
    default: defaultEditing,
    onChange: onEditingChange,
  });
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync draft when entering edit mode or when committed value changes externally.
  useEffect(() => {
    if (editing) setDraft(value);
  }, [editing, value]);

  const submit = useCallback(() => {
    setValue(draft);
    setEditing(false);
  }, [draft, setValue, setEditing]);

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value, setEditing]);

  const ctx = useMemo<EditableContextValue>(
    () => ({
      value,
      draft,
      setDraft,
      isEditing: editing,
      setEditing,
      submit,
      cancel,
      placeholder,
      isDisabled,
      isReadOnly,
      canSubmitOnBlur,
      canSubmitOnEnter,
      canCancelOnEscape,
      inputRef,
    }),
    [
      value,
      draft,
      editing,
      setEditing,
      submit,
      cancel,
      placeholder,
      isDisabled,
      isReadOnly,
      canSubmitOnBlur,
      canSubmitOnEnter,
      canCancelOnEscape,
    ],
  );

  return (
    <EditableContext.Provider value={ctx}>
      <div className={cn('inline-flex items-center gap-1.5', className)}>
        {children}
        {name && <input type="hidden" name={name} value={value} />}
      </div>
    </EditableContext.Provider>
  );
}

export type EditablePreviewProps = HTMLAttributes<HTMLSpanElement>;

export const EditablePreview = forwardRef<HTMLSpanElement, EditablePreviewProps>(
  function EditablePreview({ className, onClick, onKeyDown, ...rest }, forwardedRef) {
    const ctx = useEditableContext();
    if (ctx.isEditing) return null;
    const isEmpty = !ctx.value;
    const interactive = !ctx.isDisabled && !ctx.isReadOnly;
    return (
      <span
        ref={forwardedRef}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : -1}
        aria-disabled={!interactive || undefined}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || !interactive) return;
          ctx.setEditing(true);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented || !interactive) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ctx.setEditing(true);
          }
        }}
        className={cn(
          'cursor-text rounded-sm px-1 py-0.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isEmpty && 'italic text-subtle-foreground',
          !interactive && 'cursor-default hover:bg-transparent',
          className,
        )}
        {...rest}
      >
        {ctx.value || ctx.placeholder}
      </span>
    );
  },
);

export interface EditableInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>,
    InputBaseVariants {}

export const EditableInput = forwardRef<HTMLInputElement, EditableInputProps>(
  function EditableInput(
    { className, size, state, onKeyDown, onBlur, ...rest },
    forwardedRef,
  ) {
    const ctx = useEditableContext();

    useEffect(() => {
      if (ctx.isEditing && ctx.inputRef.current) {
        ctx.inputRef.current.focus();
        const len = ctx.inputRef.current.value.length;
        ctx.inputRef.current.setSelectionRange(len, len);
      }
    }, [ctx.isEditing, ctx.inputRef]);

    if (!ctx.isEditing) return null;

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (ctx.canSubmitOnEnter && e.key === 'Enter') {
        e.preventDefault();
        ctx.submit();
      } else if (ctx.canCancelOnEscape && e.key === 'Escape') {
        e.preventDefault();
        ctx.cancel();
      }
    };

    return (
      <input
        ref={composeRefs(forwardedRef, ctx.inputRef)}
        type="text"
        value={ctx.draft}
        disabled={ctx.isDisabled}
        readOnly={ctx.isReadOnly}
        onChange={(e) => ctx.setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e);
          if (e.defaultPrevented) return;
          if (ctx.canSubmitOnBlur) ctx.submit();
        }}
        className={cn(inputBaseVariants({ size, state }), className)}
        {...rest}
      />
    );
  },
);

export type EditableButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const EditableSubmit = forwardRef<HTMLButtonElement, EditableButtonProps>(
  function EditableSubmit({ className, onClick, children, type = 'button', ...rest }, forwardedRef) {
    const ctx = useEditableContext();
    if (!ctx.isEditing) return null;
    return (
      <button
        ref={forwardedRef}
        type={type}
        aria-label="Submit"
        // onMouseDown so we fire before the input's blur handler closes us.
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.submit();
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition-colors hover:bg-success-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children ?? <Icon icon={Check} size={14} />}
      </button>
    );
  },
);

export const EditableCancel = forwardRef<HTMLButtonElement, EditableButtonProps>(
  function EditableCancel({ className, onClick, children, type = 'button', ...rest }, forwardedRef) {
    const ctx = useEditableContext();
    if (!ctx.isEditing) return null;
    return (
      <button
        ref={forwardedRef}
        type={type}
        aria-label="Cancel"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.cancel();
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children ?? <Icon icon={X} size={14} />}
      </button>
    );
  },
);

type EditableComponent = typeof Editable & {
  Preview: typeof EditablePreview;
  Input: typeof EditableInput;
  Submit: typeof EditableSubmit;
  Cancel: typeof EditableCancel;
};

(Editable as EditableComponent).Preview = EditablePreview;
(Editable as EditableComponent).Input = EditableInput;
(Editable as EditableComponent).Submit = EditableSubmit;
(Editable as EditableComponent).Cancel = EditableCancel;

export default Editable as EditableComponent;
