import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { composeRefs } from '../../utils';
import { Slot } from '../../primitives';
import { useControlled } from '../../hooks';
import {
  Menu,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  type MenuProps,
} from '../menu';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  placement: MenuProps['placement'];
  offset: number;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu.* must be used inside <DropdownMenu>');
  return ctx;
}

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: MenuProps['placement'];
  offset?: number;
  children: ReactNode;
}

export function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  offset = 6,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const ctx = useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, triggerRef, placement, offset }),
    [open, setOpen, placement, offset],
  );

  return <DropdownMenuContext.Provider value={ctx}>{children}</DropdownMenuContext.Provider>;
}

export interface DropdownMenuTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Render the trigger as the single child (e.g., `<Button>`). */
  asChild?: boolean;
  children: ReactNode;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger(
    { asChild, onClick, onKeyDown, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useDropdownMenuContext();
    const Component = asChild ? Slot : 'button';

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        ctx.setOpen(!ctx.open);
      },
      [ctx, onClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx.setOpen(true);
        }
      },
      [ctx, onKeyDown],
    );

    return (
      <Component
        ref={composeRefs(forwardedRef, ctx.triggerRef) as never}
        type="button"
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        data-state={ctx.open ? 'open' : 'closed'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export interface DropdownMenuContentProps {
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
}

export function DropdownMenuContent({
  className,
  'aria-label': ariaLabel,
  children,
}: DropdownMenuContentProps) {
  const ctx = useDropdownMenuContext();
  return (
    <Menu
      open={ctx.open}
      anchor={ctx.triggerRef.current}
      onClose={() => {
        ctx.setOpen(false);
        requestAnimationFrame(() => ctx.triggerRef.current?.focus());
      }}
      placement={ctx.placement}
      offset={ctx.offset}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Menu>
  );
}

type DropdownMenuComponent = typeof DropdownMenu & {
  Trigger: typeof DropdownMenuTrigger;
  Content: typeof DropdownMenuContent;
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

(DropdownMenu as DropdownMenuComponent).Trigger = DropdownMenuTrigger;
(DropdownMenu as DropdownMenuComponent).Content = DropdownMenuContent;
(DropdownMenu as DropdownMenuComponent).Item = MenuItem;
(DropdownMenu as DropdownMenuComponent).Group = MenuGroup;
(DropdownMenu as DropdownMenuComponent).Label = MenuLabel;
(DropdownMenu as DropdownMenuComponent).Separator = MenuSeparator;

export default DropdownMenu as DropdownMenuComponent;
