import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../utils';

/* Drag-to-reorder list. Headless behavior + minimal styling — consumers render their own rows.
 * Reorder fires `onReorder(from, to)`; the consumer owns the array and re-renders.
 * Drag is handle-initiated (the row only becomes draggable while a `Sortable.Handle` is pressed),
 * so inputs/selects inside a row stay interactive. Keyboard: focus a handle, Arrow Up/Down to move. */

interface SortableContextValue {
  dragIndex: number | null;
  overIndex: number | null;
  begin: (index: number) => void;
  hover: (index: number) => void;
  end: () => void;
  move: (from: number, to: number) => void;
}
const SortableContext = createContext<SortableContextValue | null>(null);

interface ItemContextValue {
  index: number;
  arm: () => void;
  disarm: () => void;
}
const ItemContext = createContext<ItemContextValue | null>(null);

const useSortableRoot = (): SortableContextValue => {
  const ctx = useContext(SortableContext);
  if (!ctx) throw new Error('Sortable.Item must be rendered inside <Sortable>.');
  return ctx;
};

const useSortableItem = (): ItemContextValue => {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error('Sortable.Handle must be rendered inside <Sortable.Item>.');
  return ctx;
};

export interface SortableProps extends ComponentPropsWithoutRef<'div'> {
  /** Fired when a drag or keyboard move completes — move the item at `from` to `to`. Indices are raw; clamp in the handler. */
  onReorder: (from: number, to: number) => void;
}

const SortableRoot = forwardRef<HTMLDivElement, SortableProps>(
  ({ onReorder, className, children, ...props }, ref) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const dragRef = useRef<number | null>(null);
    const overRef = useRef<number | null>(null);

    const begin = useCallback((index: number) => {
      dragRef.current = index;
      setDragIndex(index);
    }, []);

    const hover = useCallback((index: number) => {
      overRef.current = index;
      setOverIndex(index);
    }, []);

    const end = useCallback(() => {
      const from = dragRef.current;
      const to = overRef.current;
      if (from !== null && to !== null && from !== to) onReorder(from, to);
      dragRef.current = null;
      overRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
    }, [onReorder]);

    const move = useCallback(
      (from: number, to: number) => {
        if (from !== to && to >= 0) onReorder(from, to);
      },
      [onReorder],
    );

    return (
      <SortableContext.Provider value={{ dragIndex, overIndex, begin, hover, end, move }}>
        <div ref={ref} className={cn('flex flex-col', className)} {...props}>
          {children}
        </div>
      </SortableContext.Provider>
    );
  },
);
SortableRoot.displayName = 'Sortable';

export interface SortableItemProps extends ComponentPropsWithoutRef<'div'> {
  /** Zero-based position of this item in the list. */
  index: number;
}

const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  ({ index, className, children, ...props }, ref) => {
    const { dragIndex, overIndex, begin, hover, end } = useSortableRoot();
    const [armed, setArmed] = useState(false);
    const isDragging = dragIndex === index;
    const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

    return (
      <ItemContext.Provider value={{ index, arm: () => setArmed(true), disarm: () => setArmed(false) }}>
        <div
          ref={ref}
          draggable={armed}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            begin(index);
          }}
          onDragEnter={() => hover(index)}
          onDragOver={(e) => {
            if (dragIndex !== null) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            end();
            setArmed(false);
          }}
          onDragEnd={() => {
            end();
            setArmed(false);
          }}
          data-dragging={isDragging || undefined}
          data-over={isOver || undefined}
          className={cn('transition-opacity', isDragging && 'opacity-50', className)}
          {...props}
        >
          {children}
        </div>
      </ItemContext.Provider>
    );
  },
);
SortableItem.displayName = 'Sortable.Item';

export type SortableHandleProps = ComponentPropsWithoutRef<'button'>;

const SortableHandle = forwardRef<HTMLButtonElement, SortableHandleProps>(
  ({ className, onKeyDown, children, ...props }, ref) => {
    const { index, arm, disarm } = useSortableItem();
    const { move } = useSortableRoot();

    return (
      <button
        ref={ref}
        type="button"
        aria-label="Drag to reorder"
        aria-roledescription="sortable item handle"
        onPointerDown={arm}
        onPointerUp={disarm}
        onBlur={disarm}
        onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            move(index, index - 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            move(index, index + 1);
          }
          onKeyDown?.(e);
        }}
        className={cn(
          'inline-flex cursor-grab touch-none items-center justify-center text-subtle-foreground transition-colors hover:text-muted-foreground active:cursor-grabbing',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
SortableHandle.displayName = 'Sortable.Handle';

/** Provides a compound drag-to-reorder list — `Sortable` root + `Sortable.Item` + `Sortable.Handle`. */
export const Sortable = Object.assign(SortableRoot, {
  Item: SortableItem,
  Handle: SortableHandle,
});
