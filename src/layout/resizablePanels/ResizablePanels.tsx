import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';

interface PanelInfo {
  index: number;
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

interface ResizableContextValue {
  orientation: 'horizontal' | 'vertical';
  sizes: number[];
  panels: React.MutableRefObject<PanelInfo[]>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  beginDrag: (separatorIndex: number, event: ReactMouseEvent) => void;
  nudge: (separatorIndex: number, deltaPct: number) => void;
  resetPair: (separatorIndex: number) => void;
}

const ResizableContext = createContext<ResizableContextValue | null>(null);

function useResizableContext() {
  const ctx = useContext(ResizableContext);
  if (!ctx) throw new Error('ResizablePanels.* must be used inside <ResizablePanels>');
  return ctx;
}

export interface ResizablePanelsProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  sizes?: number[];
  onSizesChange?: (sizes: number[]) => void;
  children: ReactNode;
}

function countPanels(children: ReactNode): number {
  let n = 0;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && (child.type as { displayName?: string }).displayName === 'ResizablePanel') {
      n += 1;
    }
  });
  return n;
}

export const ResizablePanels = forwardRef<HTMLDivElement, ResizablePanelsProps>(
  function ResizablePanels(
    { orientation = 'horizontal', defaultSizes, sizes: sizesProp, onSizesChange, className, children, ...rest },
    forwardedRef,
  ) {
    const panels = useRef<PanelInfo[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const panelCount = countPanels(children);

    const initialSizes =
      defaultSizes && defaultSizes.length === panelCount
        ? defaultSizes
        : Array(panelCount).fill(100 / Math.max(panelCount, 1));

    const [sizes, setSizes] = useControlled<number[]>({
      controlled: sizesProp,
      default: initialSizes,
      onChange: onSizesChange,
    });

    // If the panel count changes (children added/removed), reset to equal sizes.
    useEffect(() => {
      if (sizes.length === panelCount) return;
      setSizes(Array(panelCount).fill(100 / Math.max(panelCount, 1)));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panelCount]);

    const applyDelta = useCallback(
      (separatorIndex: number, deltaPct: number) => {
        const a = separatorIndex;
        const b = separatorIndex + 1;
        const aInfo = panels.current[a];
        const bInfo = panels.current[b];
        if (!aInfo || !bInfo) return;
        const next = sizes.slice();
        let nextA = next[a]! + deltaPct;
        let nextB = next[b]! - deltaPct;

        // Clamp by min/max — adjust deltaPct on overshoot.
        if (nextA < aInfo.minSize) {
          const adj = aInfo.minSize - nextA;
          nextA += adj;
          nextB -= adj;
        }
        if (nextB < bInfo.minSize) {
          const adj = bInfo.minSize - nextB;
          nextB += adj;
          nextA -= adj;
        }
        if (nextA > aInfo.maxSize) {
          const adj = nextA - aInfo.maxSize;
          nextA -= adj;
          nextB += adj;
        }
        if (nextB > bInfo.maxSize) {
          const adj = nextB - bInfo.maxSize;
          nextB -= adj;
          nextA += adj;
        }

        next[a] = nextA;
        next[b] = nextB;
        setSizes(next);
      },
      [sizes, setSizes],
    );

    const beginDrag = useCallback(
      (separatorIndex: number, event: ReactMouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const startX = event.clientX;
        const startY = event.clientY;
        const rect = container.getBoundingClientRect();
        const total = orientation === 'horizontal' ? rect.width : rect.height;
        if (total === 0) return;

        const startSizes = sizes.slice();

        const onMove = (e: MouseEvent) => {
          const deltaPx =
            orientation === 'horizontal' ? e.clientX - startX : e.clientY - startY;
          const deltaPct = (deltaPx / total) * 100;
          // Recompute against the start state, not the live state, to prevent drift.
          const a = separatorIndex;
          const b = separatorIndex + 1;
          const aInfo = panels.current[a];
          const bInfo = panels.current[b];
          if (!aInfo || !bInfo) return;
          let nextA = startSizes[a]! + deltaPct;
          let nextB = startSizes[b]! - deltaPct;
          nextA = Math.max(aInfo.minSize, Math.min(aInfo.maxSize, nextA));
          nextB = Math.max(bInfo.minSize, Math.min(bInfo.maxSize, nextB));
          // Restore the locked total after clamping.
          const sum = nextA + nextB;
          const startSum = startSizes[a]! + startSizes[b]!;
          if (sum !== startSum) {
            const diff = startSum - sum;
            // Push surplus onto whichever side has slack.
            if (nextA + diff <= aInfo.maxSize && nextA + diff >= aInfo.minSize) {
              nextA = nextA + diff;
            } else {
              nextB = nextB + diff;
            }
          }
          const next = startSizes.slice();
          next[a] = nextA;
          next[b] = nextB;
          setSizes(next);
        };

        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };

        document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      },
      [orientation, sizes, setSizes],
    );

    const resetPair = useCallback(
      (separatorIndex: number) => {
        const a = separatorIndex;
        const b = separatorIndex + 1;
        const aInfo = panels.current[a];
        const bInfo = panels.current[b];
        if (!aInfo || !bInfo) return;
        const next = sizes.slice();
        const total = next[a]! + next[b]!;
        next[a] = (total * aInfo.defaultSize) / (aInfo.defaultSize + bInfo.defaultSize);
        next[b] = total - next[a]!;
        setSizes(next);
      },
      [sizes, setSizes],
    );

    const ctx = useMemo<ResizableContextValue>(
      () => ({
        orientation,
        sizes,
        panels,
        containerRef,
        beginDrag,
        nudge: applyDelta,
        resetPair,
      }),
      [orientation, sizes, beginDrag, applyDelta, resetPair],
    );

    // Render children with separator indices threaded through.
    let panelIdx = 0;
    let sepIdx = 0;
    const elements = Children.map(children, (child) => {
      if (!isValidElement(child)) return child;
      const displayName = (child.type as { displayName?: string }).displayName;
      if (displayName === 'ResizablePanel') {
        const node = (
          <ResizablePanelInner
            key={`p-${panelIdx}`}
            index={panelIdx}
            {...(child.props as ResizablePanelProps)}
          />
        );
        panelIdx += 1;
        return node;
      }
      if (displayName === 'ResizableSeparator') {
        const node = (
          <ResizableSeparatorInner
            key={`s-${sepIdx}`}
            index={sepIdx}
            {...(child.props as ResizableSeparatorProps)}
          />
        );
        sepIdx += 1;
        return node;
      }
      return child;
    });

    return (
      <ResizableContext.Provider value={ctx}>
        <div
          ref={(el) => {
            containerRef.current = el;
            if (typeof forwardedRef === 'function') forwardedRef(el);
            else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          data-orientation={orientation}
          className={cn(
            'flex h-full w-full',
            orientation === 'horizontal' ? 'flex-row' : 'flex-col',
            className,
          )}
          {...rest}
        >
          {elements}
        </div>
      </ResizableContext.Provider>
    );
  },
);

export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  children?: ReactNode;
}

interface ResizablePanelInnerProps extends ResizablePanelProps {
  index: number;
}

function ResizablePanelInner({
  index,
  defaultSize = 100,
  minSize = 0,
  maxSize = 100,
  className,
  children,
  ...rest
}: ResizablePanelInnerProps) {
  const ctx = useResizableContext();

  // Register panel info before first paint so beginDrag can reference it.
  if (!ctx.panels.current[index]) {
    ctx.panels.current[index] = { index, defaultSize, minSize, maxSize };
  } else {
    ctx.panels.current[index] = { index, defaultSize, minSize, maxSize };
  }

  const size = ctx.sizes[index] ?? defaultSize;

  return (
    <div
      data-panel-index={index}
      className={cn('overflow-auto', className)}
      style={
        ctx.orientation === 'horizontal'
          ? { width: `${size}%`, height: '100%' }
          : { height: `${size}%`, width: '100%' }
      }
      {...rest}
    >
      {children}
    </div>
  );
}

// Marker component — ResizablePanels swaps each <ResizablePanel> for its inner
// impl via Children.map. The wrapper exists only as a typed slot.
export const ResizablePanel = forwardRef<HTMLDivElement, ResizablePanelProps>(
  function ResizablePanel() {
    return null;
  },
);
ResizablePanel.displayName = 'ResizablePanel';

export interface ResizableSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
}

interface ResizableSeparatorInnerProps extends ResizableSeparatorProps {
  index: number;
}

function ResizableSeparatorInner({
  index,
  disabled,
  className,
  onKeyDown,
  onDoubleClick,
  ...rest
}: ResizableSeparatorInnerProps) {
  const ctx = useResizableContext();
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    ctx.beginDrag(index, e);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mouseup', onUp);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled) return;
    const step = e.shiftKey ? 10 : 1;
    if (ctx.orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        ctx.nudge(index, -step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        ctx.nudge(index, step);
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        ctx.nudge(index, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        ctx.nudge(index, step);
      }
    }
  };

  const ariaValueNow = ctx.sizes[index + 1] ?? 50;
  const nextPanel = ctx.panels.current[index + 1];

  return (
    <div
      role="separator"
      aria-orientation={ctx.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(ariaValueNow)}
      aria-valuemin={nextPanel?.minSize ?? 0}
      aria-valuemax={nextPanel?.maxSize ?? 100}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-dragging={dragging || undefined}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={(e) => {
        onDoubleClick?.(e);
        if (e.defaultPrevented || disabled) return;
        ctx.resetPair(index);
      }}
      className={cn(
        'flex shrink-0 items-center justify-center bg-border transition-colors',
        ctx.orientation === 'horizontal'
          ? 'w-1 cursor-col-resize hover:bg-border-strong data-[dragging]:bg-primary'
          : 'h-1 cursor-row-resize hover:bg-border-strong data-[dragging]:bg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'cursor-default opacity-50 hover:bg-border',
        className,
      )}
      {...rest}
    />
  );
}

export const ResizableSeparator = forwardRef<HTMLDivElement, ResizableSeparatorProps>(
  function ResizableSeparator() {
    return null;
  },
);
ResizableSeparator.displayName = 'ResizableSeparator';

type ResizablePanelsComponent = typeof ResizablePanels & {
  Panel: typeof ResizablePanel;
  Separator: typeof ResizableSeparator;
};

(ResizablePanels as ResizablePanelsComponent).Panel = ResizablePanel;
(ResizablePanels as ResizablePanelsComponent).Separator = ResizableSeparator;

export default ResizablePanels as ResizablePanelsComponent;
