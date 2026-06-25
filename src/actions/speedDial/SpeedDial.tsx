import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Plus, X } from 'lucide-react';
import { cn, composeRefs } from '../../utils';
import { useControlled, useEscape, useOutsideClick } from '../../hooks';
import { Presence } from '../../primitives';
import { Icon } from '../../icons';
import { FAB } from '../fab';
import type { FABVariants } from '../fab/FAB.variants';

export type SpeedDialPosition = NonNullable<FABVariants['position']>;
export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right';

interface SpeedDialContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  rootRef: React.MutableRefObject<HTMLDivElement | null>;
  direction: SpeedDialDirection;
  position: SpeedDialPosition;
}

const SpeedDialContext = createContext<SpeedDialContextValue | null>(null);

function useSpeedDialContext() {
  const ctx = useContext(SpeedDialContext);
  if (!ctx) throw new Error('SpeedDial.* must be used inside <SpeedDial>');
  return ctx;
}

/**
 * `Presence`-clonable list: a single `forwardRef` element that spreads
 * `data-state` (injected by `Presence`) + `ref` onto its node. Marked `group`
 * so each action item animates off its `data-[state]`; carries its own fade so
 * `Presence` has an animation on *this* node to watch before unmount. `forwardRef`
 * + `{...props}` spread are required so the ref and `data-state` actually land here.
 */
const SpeedDialList = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  function SpeedDialList({ className, children, ...props }, ref) {
    return (
      <ul
        ref={ref}
        role="menu"
        className={cn(
          'group absolute flex',
          /* list fade gated on data-state; motion-safe so reduced-motion users
             get no movement. */
          'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
          'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
          'motion-reduce:animate-none',
          /* Per-item enter stagger: ramp `animation-delay` on the first few items
             while opening only (closed → delay 0 so no item outlasts the list's
             own fade-out, which gates unmount). */
          'motion-safe:group-data-[state=open]:[&>li:nth-child(2)]:[animation-delay:40ms]',
          'motion-safe:group-data-[state=open]:[&>li:nth-child(3)]:[animation-delay:80ms]',
          'motion-safe:group-data-[state=open]:[&>li:nth-child(4)]:[animation-delay:120ms]',
          'motion-safe:group-data-[state=open]:[&>li:nth-child(n+5)]:[animation-delay:160ms]',
          className,
        )}
        {...props}
      >
        {children}
      </ul>
    );
  },
);

const POSITION_TO_DIRECTION: Record<SpeedDialPosition, SpeedDialDirection> = {
  'bottom-right': 'up',
  'bottom-left': 'up',
  'bottom-center': 'up',
  'top-right': 'down',
  'top-left': 'down',
};

const POSITION_OFFSETS: Record<SpeedDialPosition, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const DIRECTION_TO_STACK: Record<SpeedDialDirection, string> = {
  up: 'flex-col-reverse bottom-full mb-3',
  down: 'flex-col top-full mt-3',
  left: 'flex-row-reverse right-full mr-3',
  right: 'flex-row top-1/2 -translate-y-1/2 left-full ml-3',
};

const DIRECTION_LABEL_SIDE: Record<SpeedDialDirection, 'left' | 'right'> = {
  up: 'right',
  down: 'right',
  left: 'right',
  right: 'left',
};

export interface SpeedDialProps {
  position?: SpeedDialPosition;
  direction?: SpeedDialDirection;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  gap?: number;
  className?: string;
  children: ReactNode;
}

export function SpeedDial({
  position = 'bottom-right',
  direction,
  isOpen: openProp,
  defaultOpen = false,
  onOpenChange,
  gap = 12,
  className,
  children,
}: SpeedDialProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const resolvedDirection = direction ?? POSITION_TO_DIRECTION[position];

  useEscape(() => {
    if (!open) return;
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, open);

  useOutsideClick(
    rootRef,
    () => {
      if (open) setOpen(false);
    },
    open,
  );

  const ctx = useMemo<SpeedDialContextValue>(
    () => ({ open, setOpen, triggerRef, rootRef, direction: resolvedDirection, position }),
    [open, setOpen, resolvedDirection, position],
  );

  // The trigger renders always (a closed dial must still be openable); only the
  // action items are gated behind `open`.
  const childArray = Children.toArray(children);
  const triggerChildren = childArray.filter(
    (child) => isValidElement(child) && child.type === SpeedDialTrigger,
  );
  const actionChildren = childArray.filter(
    (child) => !(isValidElement(child) && child.type === SpeedDialTrigger),
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (items.length === 0) return;
    e.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      currentIndex === -1
        ? e.key === 'ArrowDown'
          ? 0
          : items.length - 1
        : (currentIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <SpeedDialContext.Provider value={ctx}>
      <div
        ref={rootRef}
        data-state={open ? 'open' : 'closed'}
        onKeyDown={handleKeyDown}
        className={cn('fixed', POSITION_OFFSETS[position], className)}
      >
        {/* `Presence` clones `data-state` ("open" | "closed") + a `ref` onto the
            list and defers unmount until its fade-out ends — keeps the exit from
            being killed by the hard `!open` unmount. Items pop in/out off the
            list's `group` state (see `SpeedDialAction`), staggered on enter. */}
        <Presence isPresent={open}>
          <SpeedDialList
            data-direction={resolvedDirection}
            style={{ gap }}
            className={DIRECTION_TO_STACK[resolvedDirection]}
          >
            {actionChildren}
          </SpeedDialList>
        </Presence>
        {triggerChildren}
      </div>
    </SpeedDialContext.Provider>
  );
}

export interface SpeedDialTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required accessible label. Default `"Toggle actions"`. */
  'aria-label'?: string;
  closedIcon?: ReactNode;
  openIcon?: ReactNode;
  variant?: FABVariants['variant'];
  size?: FABVariants['size'];
}

export const SpeedDialTrigger = forwardRef<HTMLButtonElement, SpeedDialTriggerProps>(
  function SpeedDialTrigger(
    {
      'aria-label': ariaLabel = 'Toggle actions',
      closedIcon,
      openIcon,
      variant,
      size,
      onClick,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const ctx = useSpeedDialContext();
    return (
      <FAB
        {...rest}
        ref={composeRefs(forwardedRef, ctx.triggerRef)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        variant={variant}
        size={size}
        position={ctx.position}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.setOpen(!ctx.open);
        }}
        className={cn('static !bottom-auto !left-auto !right-auto !top-auto !translate-x-0', className)}
      >
        {ctx.open ? openIcon ?? <Icon icon={X} size={20} /> : closedIcon ?? <Icon icon={Plus} size={20} />}
      </FAB>
    );
  },
);

export interface SpeedDialActionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  'aria-label': string;
  icon: ReactNode;
  onSelect?: () => void;
  tooltip?: ReactNode;
}

export const SpeedDialAction = forwardRef<HTMLButtonElement, SpeedDialActionProps>(
  function SpeedDialAction(
    { 'aria-label': ariaLabel, icon, onSelect, tooltip, className, onClick, type = 'button', ...rest },
    forwardedRef,
  ) {
    const ctx = useSpeedDialContext();
    const labelSide = DIRECTION_LABEL_SIDE[ctx.direction];
    return (
      <li
        role="none"
        data-side={labelSide}
        className={cn(
          'flex items-center gap-2',
          /* fade+scale each action off the list's `group` state; motion-safe so
             reduced-motion users get no movement (delay ramp lives on the list). */
          'motion-safe:group-data-[state=open]:animate-(--animate-pop-in)',
          'motion-safe:group-data-[state=closed]:animate-(--animate-pop-out)',
          'motion-reduce:animate-none',
        )}
      >
        {tooltip && labelSide === 'left' && (
          <span className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
            {tooltip}
          </span>
        )}
        <button
          {...rest}
          ref={forwardedRef}
          type={type}
          role="menuitem"
          aria-label={ariaLabel}
          onClick={(e) => {
            onClick?.(e);
            if (e.defaultPrevented) return;
            onSelect?.();
            ctx.setOpen(false);
            requestAnimationFrame(() => ctx.triggerRef.current?.focus());
          }}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-card-foreground shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          {icon}
        </button>
        {tooltip && labelSide === 'right' && (
          <span className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
            {tooltip}
          </span>
        )}
      </li>
    );
  },
);

type SpeedDialComponent = typeof SpeedDial & {
  Trigger: typeof SpeedDialTrigger;
  Action: typeof SpeedDialAction;
};

(SpeedDial as SpeedDialComponent).Trigger = SpeedDialTrigger;
(SpeedDial as SpeedDialComponent).Action = SpeedDialAction;

export default SpeedDial as SpeedDialComponent;
