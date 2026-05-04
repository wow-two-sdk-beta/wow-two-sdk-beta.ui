import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import {
  AnchoredPositioner,
  DismissableLayer,
  Portal,
  RovingFocusGroup,
  useRovingFocusItem,
} from '../../primitives';

interface NavigationMenuContextValue {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);

function useNavContext() {
  const ctx = useContext(NavigationMenuContext);
  if (!ctx) throw new Error('NavigationMenu.* must be used inside <NavigationMenu>');
  return ctx;
}

interface NavigationMenuItemContextValue {
  value: string;
  open: boolean;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  contentId: string;
  triggerId: string;
}

const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);

function useNavItemContext() {
  const ctx = useContext(NavigationMenuItemContext);
  if (!ctx)
    throw new Error('NavigationMenu.Trigger / Content must be used inside <NavigationMenu.Item>');
  return ctx;
}

export interface NavigationMenuProps extends Omit<HTMLAttributes<HTMLElement>, 'defaultValue'> {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

export const NavigationMenu = forwardRef<HTMLElement, NavigationMenuProps>(
  function NavigationMenu(
    {
      value,
      defaultValue = null,
      onValueChange,
      'aria-label': ariaLabel = 'Main navigation',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const [activeId, setActiveId] = useControlled<string | null>({
      controlled: value,
      default: defaultValue,
      onChange: onValueChange,
    });

    const ctx = useMemo<NavigationMenuContextValue>(
      () => ({ activeId, setActiveId }),
      [activeId, setActiveId],
    );

    return (
      <NavigationMenuContext.Provider value={ctx}>
        <nav
          ref={ref}
          aria-label={ariaLabel}
          className={cn('relative', className)}
          {...rest}
        >
          {children}
        </nav>
      </NavigationMenuContext.Provider>
    );
  },
);

export interface NavigationMenuListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const NavigationMenuList = forwardRef<HTMLDivElement, NavigationMenuListProps>(
  function NavigationMenuList({ className, children, ...rest }, ref) {
    return (
      <RovingFocusGroup
        ref={ref}
        orientation="horizontal"
        loop
        role="list"
        className={cn('flex items-center gap-1', className)}
        {...rest}
      >
        {children}
      </RovingFocusGroup>
    );
  },
);

export interface NavigationMenuItemProps extends HTMLAttributes<HTMLLIElement> {
  /** Stable id for active-state tracking. Required when item has a Trigger + Content. */
  value: string;
  children: ReactNode;
}

export const NavigationMenuItem = forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  function NavigationMenuItem({ value, className, children, ...rest }, ref) {
    const nav = useNavContext();
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const contentId = useId();
    const triggerId = useId();
    const open = nav.activeId === value;

    const itemCtx = useMemo<NavigationMenuItemContextValue>(
      () => ({ value, open, triggerRef, contentId, triggerId }),
      [value, open, contentId, triggerId],
    );

    return (
      <NavigationMenuItemContext.Provider value={itemCtx}>
        <li ref={ref} className={cn('relative', className)} {...rest}>
          {children}
        </li>
      </NavigationMenuItemContext.Provider>
    );
  },
);

export interface NavigationMenuTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export const NavigationMenuTrigger = forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  function NavigationMenuTrigger(
    { className, onClick, onPointerEnter, onKeyDown, onFocus, children, ...rest },
    ref,
  ) {
    const nav = useNavContext();
    const item = useNavItemContext();
    const roving = useRovingFocusItem();
    return (
      <button
        ref={(node) => {
          item.triggerRef.current = node;
          roving.ref(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={item.triggerId}
        type="button"
        aria-haspopup="true"
        aria-expanded={item.open}
        aria-controls={item.contentId}
        data-state={item.open ? 'open' : 'closed'}
        tabIndex={roving.tabIndex}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          nav.setActiveId(item.open ? null : item.value);
        }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e);
          if (nav.activeId !== null && nav.activeId !== item.value) {
            nav.setActiveId(item.value);
          }
        }}
        onFocus={(e) => {
          onFocus?.(e);
          roving.onFocus();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          roving.onKeyDown(e);
        }}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted',
          className,
        )}
        {...rest}
      >
        {children}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', item.open && 'rotate-180')}
        />
      </button>
    );
  },
);

export interface NavigationMenuLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  children: ReactNode;
}

export const NavigationMenuLink = forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  function NavigationMenuLink({ className, onKeyDown, onFocus, children, ...rest }, ref) {
    const roving = useRovingFocusItem();
    return (
      <a
        ref={(node) => {
          roving.ref(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        tabIndex={roving.tabIndex}
        onFocus={(e) => {
          onFocus?.(e);
          roving.onFocus();
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          roving.onKeyDown(e);
        }}
        className={cn(
          'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

export interface NavigationMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const NavigationMenuContent = forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  function NavigationMenuContent({ className, children, ...rest }, ref) {
    const nav = useNavContext();
    const item = useNavItemContext();

    const handleClose = useCallback(() => {
      nav.setActiveId(null);
      requestAnimationFrame(() => item.triggerRef.current?.focus());
    }, [nav, item.triggerRef]);

    // Close on outside click that lands outside the trigger AND outside the content.
    useEffect(() => {
      // Use the existing DismissableLayer below — this effect intentionally empty.
    }, []);

    if (!item.open) return null;
    return (
      <Portal>
        <AnchoredPositioner anchor={item.triggerRef.current} placement="bottom-start" offset={6}>
          <DismissableLayer
            onEscape={handleClose}
            onOutsidePointerDown={(e) => {
              if (item.triggerRef.current?.contains(e.target as Node)) return;
              nav.setActiveId(null);
            }}
          >
            <div
              ref={ref}
              id={item.contentId}
              aria-labelledby={item.triggerId}
              data-state="open"
              className={cn(
                'z-50 min-w-[12rem] rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95',
                className,
              )}
              {...rest}
            >
              {children}
            </div>
          </DismissableLayer>
        </AnchoredPositioner>
      </Portal>
    );
  },
);

type NavigationMenuComponent = typeof NavigationMenu & {
  List: typeof NavigationMenuList;
  Item: typeof NavigationMenuItem;
  Trigger: typeof NavigationMenuTrigger;
  Content: typeof NavigationMenuContent;
  Link: typeof NavigationMenuLink;
};

(NavigationMenu as NavigationMenuComponent).List = NavigationMenuList;
(NavigationMenu as NavigationMenuComponent).Item = NavigationMenuItem;
(NavigationMenu as NavigationMenuComponent).Trigger = NavigationMenuTrigger;
(NavigationMenu as NavigationMenuComponent).Content = NavigationMenuContent;
(NavigationMenu as NavigationMenuComponent).Link = NavigationMenuLink;

export default NavigationMenu as NavigationMenuComponent;
