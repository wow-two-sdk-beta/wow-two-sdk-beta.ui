import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { cn, composeRefs } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { Tag, type TagVariants } from '../../display/tag';
import { inputBaseVariants, InputSize, InputState, type InputBaseVariants } from '../InputStyles';

export interface TagsInputProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'size'
    >,
    Omit<InputBaseVariants, 'size' | 'state'> {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onValueChange?: (tags: ReadonlyArray<string>) => void;
  inputValue?: string;
  onInputChange?: (input: string) => void;
  /** The characters that commit the current input. Enter and Tab always do. */
  delimiters?: ReadonlyArray<string>;
  /** The predicate gating committed tags. Default: non-empty after trim. */
  validate?: (tag: string) => boolean;
  allowsDuplicates?: boolean;
  max?: number;
  isInvalid?: boolean;
  /** The hidden input name; the hidden input emits the comma-joined value. */
  name?: string;
  tagVariant?: TagVariants['variant'];
}

/**
 * Free-form tag entry. Type → Enter/comma/Tab commits. Backspace at empty
 * input removes the last tag. Renders chips via `display/Tag`.
 */
export const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(function TagsInput(
  {
    value,
    defaultValue,
    onValueChange,
    inputValue,
    onInputChange,
    placeholder = 'Add tag…',
    delimiters = [','],
    validate = (t) => t.trim().length > 0,
    allowsDuplicates = false,
    max,
    isInvalid,
    disabled,
    readOnly,
    name,
    tagVariant = 'neutral',
    size,
    state,
    id,
    className,
    onKeyDown,
    onBlur,
    'aria-describedby': ariaDescribedBy,
    'aria-required': ariaRequired,
    ...rest
  },
  forwardedRef,
) {
  const [tags, setTags] = useControlled({
    controlled: value,
    default: defaultValue ?? [],
    onChange: onValueChange,
  });
  const [text, setText] = useControlled({
    controlled: inputValue,
    default: '',
    onChange: onInputChange,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  /* FormControlContext adoption — explicit props stay as overrides. */
  const ctx = useFormControl();
  const isDisabled = disabled ?? ctx?.isDisabled;
  const isReadOnly = readOnly ?? ctx?.isReadOnly;
  const invalid = isInvalid ?? ctx?.isInvalid;
  const finalState = state ?? (invalid ? InputState.Invalid : InputState.Default);

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || !validate(trimmed)) return;
      if (!allowsDuplicates && tags.includes(trimmed)) return;
      if (max != null && tags.length >= max) return;
      setTags([...tags, trimmed]);
      setText('');
    },
    [tags, validate, allowsDuplicates, max, setTags, setText],
  );

  const removeAt = useCallback(
    (idx: number) => {
      setTags(tags.filter((_, i) => i !== idx));
    },
    [tags, setTags],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || isDisabled || isReadOnly) return;
    if (e.key === 'Enter' || (e.key === 'Tab' && text)) {
      if (text) {
        e.preventDefault();
        commit(text);
        setPendingDelete(false);
      }
      return;
    }
    if (delimiters.includes(e.key)) {
      e.preventDefault();
      commit(text);
      setPendingDelete(false);
      return;
    }
    if (e.key === 'Backspace' && !text && tags.length > 0) {
      if (pendingDelete) {
        e.preventDefault();
        removeAt(tags.length - 1);
        setPendingDelete(false);
      } else {
        setPendingDelete(true);
      }
      return;
    }
    setPendingDelete(false);
  };

  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) inputRef.current?.focus();
  };

  return (
    <div
      role="group"
      onClick={handleContainerClick}
      data-disabled={isDisabled || undefined}
      data-readonly={isReadOnly || undefined}
      data-invalid={invalid || undefined}
      className={cn(
        inputBaseVariants({ size, state: finalState }),
        'h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5',
        isDisabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {tags.map((t, i) => (
        <Tag
          key={`${t}-${i}`}
          variant={tagVariant}
          data-pending-delete={pendingDelete && i === tags.length - 1 ? '' : undefined}
          onClose={!isDisabled && !isReadOnly ? () => removeAt(i) : undefined}
          className={cn(pendingDelete && i === tags.length - 1 && 'ring-1 ring-ring')}
        >
          {t}
        </Tag>
      ))}
      <input
        {...rest}
        ref={composeRefs(forwardedRef, inputRef)}
        type="text"
        /* The inner input is the composite's primary control — it carries the context id so `Field`-rendered chrome reaches it. */
        id={id ?? ctx?.id}
        value={text}
        placeholder={tags.length === 0 ? placeholder : undefined}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy ?? ctx?.describedBy}
        /* aria- (not native) required — the tag list is the value; a native `required` on the empty inner input would block submits even with tags committed. */
        aria-required={ariaRequired ?? (ctx?.isRequired || undefined)}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e);
          if (text) commit(text);
          setPendingDelete(false);
        }}
        className="min-w-[6rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed"
      />
      {name && <input type="hidden" name={name} value={tags.join(',')} />}
    </div>
  );
});
TagsInput.displayName = 'TagsInput';
