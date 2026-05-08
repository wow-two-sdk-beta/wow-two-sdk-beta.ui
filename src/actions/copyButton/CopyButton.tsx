import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Check, Copy } from 'lucide-react';
import { Icon } from '../../icons';
import { useClipboard } from '../../hooks';
import { OptionalExtensions } from '../../utils';
import { Button, type ButtonProps } from '../button/Button';

const COMPONENT_NAME = 'CopyButton';

export interface CopyButtonProps
  extends Omit<ButtonProps, 'onClick' | 'children' | 'aria-label' | 'onError'> {
  /* Text to copy when the button is activated. */
  text: string;

  /* Reset window for the `copied` state in ms. Default 2000. Set 0 to keep `copied` true until the next mount / explicit reset. */
  resetAfter?: number;

  /* Static content OR render-prop receiving `{copied, error}` for state-driven swap. Falls back to icon-only Copy/Check when omitted. */
  children?:
    | ReactNode
    | ((args: { copied: boolean; error: Error | null }) => ReactNode);

  /* Required accessible label — clipboard buttons are commonly icon-only and need a programmatic name. */
  'aria-label': string;

  /* Override aria-label while copied=true. Falls back to `aria-label` when omitted (i18n discipline — consumer supplies all user-facing strings). */
  copiedAriaLabel?: string;

  /* Called with the caught Error when `navigator.clipboard.writeText` rejects. Fires once per error transition. */
  onError?: (error: Error) => void;
}

/* Renders a clipboard-copy button — for code blocks, ID / URL fields, and inline copy affordances. */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      resetAfter = 2000,
      children,
      variant = 'ghost',
      'aria-label': ariaLabel,
      copiedAriaLabel,
      onError,
      ...props
    },
    ref,
  ) => {
    const { copied, error, copy } = useClipboard({ resetAfter });

    // Stable ref keeps the effect's deps minimal — onError can be re-passed
    // unstably without re-firing on every render where `error` is set.
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onErrorRef.current = onError;
    });

    useEffect(() => {
      if (error) onErrorRef.current?.(error);
    }, [error]);

    const effectiveAriaLabel = copied
      ? (copiedAriaLabel ?? ariaLabel)
      : ariaLabel;

    const content =
      typeof children === 'function'
        ? children({ copied, error })
        : (children ?? <Icon icon={copied ? Check : Copy} size={16} />);

    const handleClick = useCallback(() => {
      void copy(text);
    }, [copy, text]);

    return (
      <Button
        ref={ref}
        variant={variant}
        aria-label={effectiveAriaLabel}
        data-copied={OptionalExtensions.from(copied, 'true')}
        onClick={handleClick}
        {...props}
      >
        {content}
      </Button>
    );
  },
);

CopyButton.displayName = COMPONENT_NAME;
