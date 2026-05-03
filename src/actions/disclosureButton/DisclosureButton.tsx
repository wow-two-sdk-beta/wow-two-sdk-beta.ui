import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, dataAttr } from '../../utils';
import { Icon } from '../../icons';
import { useControlled } from '../../hooks';

export interface DisclosureButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'> {
  /** Visible label (left-aligned). */
  children?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  /** Fires whenever open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Side the chevron sits on. Default `right`. */
  chevronSide?: 'left' | 'right';
}

/**
 * Button with a chevron that rotates on open. Used as the trigger for
 * collapsible sections, accordion items, sidebar groups. Sets `aria-expanded`
 * and `data-state="open" | "closed"` for downstream content sync.
 */
export const DisclosureButton = forwardRef<HTMLButtonElement, DisclosureButtonProps>(
  (
    {
      children,
      open,
      defaultOpen = false,
      onOpenChange,
      onClick,
      chevronSide = 'right',
      className,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useControlled({
      controlled: open,
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
        {chevronSide === 'left' && chevron}
        <span className="flex-1 text-left">{children}</span>
        {chevronSide === 'right' && chevron}
      </button>
    );
  },
);
DisclosureButton.displayName = 'DisclosureButton';
