import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs } from '../../utils';
import { AnchoredPositioner, DismissableLayer, Portal } from '../../primitives';
import {
  menuItemVariants,
  menuLabelVariants,
  menuSeparatorVariants,
  menuVariants,
  type MenuItemVariants,
} from './Menu.variants';

interface MenuItemEntry {
  id: string;
  ref: HTMLButtonElement | null;
  disabled: boolean;
}

interface MenuContextValue {
  registerItem: (entry: MenuItemEntry) => void;
  unregisterItem: (id: string) => void;
  itemsRef: React.MutableRefObject<MenuItemEntry[]>;
  onClose: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('Menu.Item / Group / Label / Separator must be used inside <Menu>');
  return ctx;
}

export interface MenuProps {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  placement?: React.ComponentProps<typeof AnchoredPositioner>['placement'];
  offset?: number;
  /** A11y label for screen readers. */
  'aria-label'?: string;
  className?: string;
  children: ReactNode;
}

export function Menu({
  open,
  anchor,
  onClose,
  placement = 'bottom-start',
  offset = 6,
  'aria-label': ariaLabel,
  className,
  children,
}: MenuProps) {
  const itemsRef = useRef<MenuItemEntry[]>([]);

  const registerItem = useCallback((entry: MenuItemEntry) => {
    const idx = itemsRef.current.findIndex((i) => i.id === entry.id);
    if (idx >= 0) itemsRef.current[idx] = entry;
    else itemsRef.current.push(entry);
  }, []);
  const unregisterItem = useCallback((id: string) => {
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
  }, []);

  const ctx = useMemo<MenuContextValue>(
    () => ({ registerItem, unregisterItem, itemsRef, onClose }),
    [registerItem, unregisterItem, onClose],
  );

  if (!open) return null;
  return (
    <MenuContext.Provider value={ctx}>
      <Portal>
        <AnchoredPositioner anchor={anchor} placement={placement} offset={offset}>
          <FocusScope asChild trapped loop>
            <DismissableLayer
              onEscape={onClose}
              onOutsidePointerDown={(e) => {
                if (anchor?.contains(e.target as Node)) return;
                onClose();
              }}
            >
              <div
                role="menu"
                aria-label={ariaLabel}
                className={cn(menuVariants(), className)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    onClose();
                  }
                }}
              >
                {children}
              </div>
            </DismissableLayer>
          </FocusScope>
        </AnchoredPositioner>
      </Portal>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'>,
    MenuItemVariants {
  /** Fired when the item is activated (Enter / Space / click). Menu closes after. */
  onSelect?: () => void;
  /** Disable activation. */
  disabled?: boolean;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { onSelect, disabled = false, state, className, onClick, onKeyDown, children, ...rest },
  forwardedRef,
) {
  const ctx = useMenuContext();
  const id = useId();
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    ctx.registerItem({ id, ref: ref.current, disabled });
    return () => ctx.unregisterItem(id);
  }, [ctx, id, disabled]);

  const moveFocus = useCallback(
    (direction: 1 | -1, jump = 1) => {
      const list = ctx.itemsRef.current.filter((i) => !i.disabled);
      if (list.length === 0) return;
      const idx = list.findIndex((i) => i.id === id);
      let nextIdx = idx + direction * jump;
      if (idx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;
      list[nextIdx]?.ref?.focus();
    },
    [ctx, id],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        e.preventDefault();
        moveFocus(-1, ctx.itemsRef.current.length);
        break;
      case 'End':
        e.preventDefault();
        moveFocus(1, ctx.itemsRef.current.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.();
        ctx.onClose();
        break;
    }
  };

  const itemState = state ?? (disabled ? 'disabled' : 'default');
  return (
    <button
      ref={composeRefs(forwardedRef, ref)}
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || disabled) return;
        onSelect?.();
        ctx.onClose();
      }}
      onKeyDown={handleKeyDown}
      className={cn(menuItemVariants({ state: itemState }), className)}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface MenuGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  children: ReactNode;
}

export function MenuGroup({ label, children, className, ...rest }: MenuGroupProps) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={className}
      {...rest}
    >
      {label && (
        <div id={labelId} className={menuLabelVariants()}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function MenuLabel({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(menuLabelVariants(), className)} {...rest}>
      {children}
    </div>
  );
}

export function MenuSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={menuSeparatorVariants()} {...props} />;
}

type MenuComponent = typeof Menu & {
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

(Menu as MenuComponent).Item = MenuItem;
(Menu as MenuComponent).Group = MenuGroup;
(Menu as MenuComponent).Label = MenuLabel;
(Menu as MenuComponent).Separator = MenuSeparator;

export default Menu as MenuComponent;
