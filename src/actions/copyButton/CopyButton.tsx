import { forwardRef, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { Icon } from '../../icons';
import { useClipboard } from '../../hooks';
import { Button, type ButtonProps } from '../button/Button';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Text to copy when clicked. */
  text: string;
  /** Reset window for the "copied" state. Default 2000ms. */
  resetAfter?: number;
  /** Render-prop / static label. Receives `copied` so consumers can swap text. */
  children?: ReactNode | ((args: { copied: boolean }) => ReactNode);
  /** Accessible label when no visible text (icon-only). Default `"Copy"`. */
  'aria-label'?: string;
}

/**
 * Button that copies `text` to the clipboard. Swaps to a checkmark icon for
 * `resetAfter` ms after a successful copy.
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    { text, resetAfter = 2000, children, variant = 'ghost', 'aria-label': ariaLabel, ...props },
    ref,
  ) => {
    const { copied, copy } = useClipboard({ resetAfter });
    const label = copied ? 'Copied' : (ariaLabel ?? 'Copy');
    const content =
      typeof children === 'function'
        ? children({ copied })
        : children ?? <Icon icon={copied ? Check : Copy} size={16} />;

    return (
      <Button
        ref={ref}
        variant={variant}
        aria-label={label}
        onClick={() => void copy(text)}
        {...props}
      >
        {content}
      </Button>
    );
  },
);
CopyButton.displayName = 'CopyButton';
