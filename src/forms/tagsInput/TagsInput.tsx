import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { Tag, type TagVariants } from '../../display/tag';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface TagsInputProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'value' | 'defaultValue' | 'onChange' | 'size'
    >,
    InputBaseVariants {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  inputValue?: string;
  onInputChange?: (input: string) => void;
  /** Characters that commit the current input. Enter and Tab always do. */
  delimiters?: string[];
  /** Predicate gating committed tags. Default: non-empty after trim. */
  validate?: (tag: string) => boolean;
  allowDuplicates?: boolean;
  max?: number;
  invalid?: boolean;
  /** Hidden input emits comma-joined value. */
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
    allowDuplicates = false,
    max,
    invalid,
    disabled,
    readOnly,
    name,
    tagVariant = 'neutral',
    size,
    className,
    onKeyDown,
    onBlur,
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
  const state = invalid ? 'invalid' : 'default';

  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || !validate(trimmed)) return;
      if (!allowDuplicates && tags.includes(trimmed)) return;
      if (max != null && tags.length >= max) return;
      setTags([...tags, trimmed]);
      setText('');
    },
    [tags, validate, allowDuplicates, max, setTags, setText],
  );

  const removeAt = useCallback(
    (idx: number) => {
      setTags(tags.filter((_, i) => i !== idx));
    },
    [tags, setTags],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled || readOnly) return;
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
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={invalid || undefined}
      className={cn(
        inputBaseVariants({ size, state }),
        'h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {tags.map((t, i) => (
        <Tag
          key={`${t}-${i}`}
          variant={tagVariant}
          data-pending-delete={pendingDelete && i === tags.length - 1 ? '' : undefined}
          onClose={!disabled && !readOnly ? () => removeAt(i) : undefined}
          className={cn(pendingDelete && i === tags.length - 1 && 'ring-1 ring-ring')}
        >
          {t}
        </Tag>
      ))}
      <input
        {...rest}
        ref={composeRefs(forwardedRef, inputRef)}
        type="text"
        value={text}
        placeholder={tags.length === 0 ? placeholder : undefined}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
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
