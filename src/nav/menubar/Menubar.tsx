import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import {
  Menu,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  type MenuProps,
} from '../menu';
import { menubarTriggerVariants, menubarVariants } from './Menubar.variants';

interface MenubarContextValue {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerTrigger: (id: string, ref: HTMLButtonElement | null) => void;
  unregisterTrigger: (id: string) => void;
  triggersRef: React.MutableRefObject<{ id: string; ref: HTMLButtonElement | null }[]>;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

function useMenubarContext() {
  const ctx = useContext(MenubarContext);
  if (!ctx) throw new Error('Menubar.* must be used inside <Menubar>');
  return ctx;
}

interface MenubarMenuContextValue {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
}

const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);

function useMenubarMenuContext() {
  const ctx = useContext(MenubarMenuContext);
  if (!ctx) throw new Error('Menubar.Trigger / Content must be used inside <Menubar.Menu>');
  return ctx;
}

export interface MenubarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  /** Id of the currently-open menu, or `null` if none. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: ReactNode;
}

export const Menubar = forwardRef<HTMLDivElement, MenubarProps>(function Menubar(
  { value, defaultValue = null, onValueChange, className, children, ...rest },
  ref,
) {
  const [activeId, setActiveId] = useControlled<string | null>({
    controlled: value,
    default: defaultValue,
    onChange: onValueChange,
  });

  const triggersRef = useRef<{ id: string; ref: HTMLButtonElement | null }[]>([]);

  const registerTrigger = useCallback((id: string, triggerRef: HTMLButtonElement | null) => {
    const idx = triggersRef.current.findIndex((t) => t.id === id);
    if (idx >= 0) triggersRef.current[idx] = { id, ref: triggerRef };
    else triggersRef.current.push({ id, ref: triggerRef });
  }, []);
  const unregisterTrigger = useCallback((id: string) => {
    triggersRef.current = triggersRef.current.filter((t) => t.id !== id);
  }, []);

  const ctx = useMemo<MenubarContextValue>(
    () => ({ activeId, setActiveId, registerTrigger, unregisterTrigger, triggersRef }),
    [activeId, setActiveId, registerTrigger, unregisterTrigger],
  );

  return (
    <MenubarContext.Provider value={ctx}>
      <div
        ref={ref}
        role="menubar"
        className={cn(menubarVariants(), className)}
        {...rest}
      >
        {children}
      </div>
    </MenubarContext.Provider>
  );
});

export interface MenubarMenuProps {
  /** Stable id for this menu — used for active-menu tracking. */
  value: string;
  children: ReactNode;
}

export function MenubarMenu({ value, children }: MenubarMenuProps) {
  const ctx = useMenubarContext();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = ctx.activeId === value;
  const setOpen = useCallback(
    (next: boolean) => {
      ctx.setActiveId(next ? value : null);
    },
    [ctx, value],
  );

  const menuCtx = useMemo<MenubarMenuContextValue>(
    () => ({ id: value, open, setOpen, triggerRef }),
    [value, open, setOpen],
  );

  return <MenubarMenuContext.Provider value={menuCtx}>{children}</MenubarMenuContext.Provider>;
}

export interface MenubarTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export const MenubarTrigger = forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  function MenubarTrigger(
    { className, onClick, onKeyDown, onPointerEnter, children, ...rest },
    forwardedRef,
  ) {
    const bar = useMenubarContext();
    const menu = useMenubarMenuContext();

    useEffect(() => {
      bar.registerTrigger(menu.id, menu.triggerRef.current);
      return () => bar.unregisterTrigger(menu.id);
    }, [bar, menu.id, menu.triggerRef]);

    const moveAcross = useCallback(
      (direction: 1 | -1) => {
        const list = bar.triggersRef.current;
        const idx = list.findIndex((t) => t.id === menu.id);
        if (idx === -1) return;
        let nextIdx = idx + direction;
        if (nextIdx < 0) nextIdx = list.length - 1;
        if (nextIdx >= list.length) nextIdx = 0;
        const next = list[nextIdx];
        next?.ref?.focus();
        // If a menu is already open, switch the open menu to follow focus.
        if (bar.activeId !== null && next) bar.setActiveId(next.id);
      },
      [bar, menu.id],
    );

    return (
      <button
        ref={composeRefs(forwardedRef, menu.triggerRef)}
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        data-state={menu.open ? 'open' : 'closed'}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          menu.setOpen(!menu.open);
        }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e);
          // If any menu is open, switching the trigger pointer-over switches the active menu.
          if (bar.activeId !== null && bar.activeId !== menu.id) {
            bar.setActiveId(menu.id);
          }
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          switch (e.key) {
            case 'ArrowRight':
              e.preventDefault();
              moveAcross(1);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              moveAcross(-1);
              break;
            case 'ArrowDown':
            case 'Enter':
            case ' ':
              e.preventDefault();
              menu.setOpen(true);
              break;
            case 'Home':
              e.preventDefault();
              bar.triggersRef.current[0]?.ref?.focus();
              break;
            case 'End': {
              e.preventDefault();
              const list = bar.triggersRef.current;
              list[list.length - 1]?.ref?.focus();
              break;
            }
          }
        }}
        className={cn(menubarTriggerVariants(), className)}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

export interface MenubarContentProps {
  className?: string;
  placement?: MenuProps['placement'];
  offset?: number;
  'aria-label'?: string;
  children: ReactNode;
}

export function MenubarContent({
  className,
  placement = 'bottom-start',
  offset = 4,
  'aria-label': ariaLabel,
  children,
}: MenubarContentProps) {
  const menu = useMenubarMenuContext();
  return (
    <Menu
      open={menu.open}
      anchor={menu.triggerRef.current}
      onClose={() => {
        menu.setOpen(false);
        requestAnimationFrame(() => menu.triggerRef.current?.focus());
      }}
      placement={placement}
      offset={offset}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Menu>
  );
}

type MenubarComponent = typeof Menubar & {
  Menu: typeof MenubarMenu;
  Trigger: typeof MenubarTrigger;
  Content: typeof MenubarContent;
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

(Menubar as MenubarComponent).Menu = MenubarMenu;
(Menubar as MenubarComponent).Trigger = MenubarTrigger;
(Menubar as MenubarComponent).Content = MenubarContent;
(Menubar as MenubarComponent).Item = MenuItem;
(Menubar as MenubarComponent).Group = MenuGroup;
(Menubar as MenubarComponent).Label = MenuLabel;
(Menubar as MenubarComponent).Separator = MenuSeparator;

export default Menubar as MenubarComponent;
