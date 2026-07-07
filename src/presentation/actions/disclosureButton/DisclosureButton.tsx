import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, dataAttr, Side } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { useControlled } from '../../../foundation/hooks';

export interface DisclosureButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> {
  /** The visible label (left-aligned). */
  children?: ReactNode;
  /** The controlled open state. */
  isOpen?: boolean;
  /** The uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Emits the open state whenever it changes. */
  onOpenChange?: (open: boolean) => void;
  /** The side the chevron sits on (`left` · `right`). Default `right`. */
  chevronSide?: Side;
}

/** Button with a rotating chevron — sets `aria-expanded` + `data-state="open|closed"`. */
export const DisclosureButton = forwardRef<HTMLButtonElement, DisclosureButtonProps>(
  (
    {
      children,
      isOpen,
      defaultOpen = false,
      onOpenChange,
      onClick,
      chevronSide = Side.Right,
      className,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useControlled({
      controlled: isOpen,
      default: defaultOpen,
      onChange: onOpenChange,
    });
    const chevron = (
      <Icon
        icon={ChevronDown}
        size={16}
        className={cn('transition-transform', value && 'rotate-180')}
      />
    );
    return (
      <button
        ref={ref}
        type={type}
        aria-expanded={value}
        data-state={value ? 'open' : 'closed'}
        data-disabled={dataAttr(props.disabled)}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) setValue(!value);
        }}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {chevronSide === Side.Left && chevron}
        <span className="flex-1 text-left">{children}</span>
        {chevronSide === Side.Right && chevron}
      </button>
    );
  },
);
DisclosureButton.displayName = 'DisclosureButton';
