import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface NodeEditorNode {
  id: string;
  x: number;
  y: number;
  data?: Record<string, unknown>;
  label?: ReactNode;
}

export interface NodeEditorEdge {
  id: string;
  source: string;
  target: string;
  label?: ReactNode;
}

export interface NodeEditorProps extends HTMLAttributes<HTMLDivElement> {
  nodes: NodeEditorNode[];
  edges?: NodeEditorEdge[];
  onNodesChange?: (nodes: NodeEditorNode[]) => void;
  onEdgeClick?: (edge: NodeEditorEdge) => void;
  renderNode?: (node: NodeEditorNode) => ReactNode;
  nodeWidth?: number;
  nodeHeight?: number;
  minZoom?: number;
  maxZoom?: number;
}

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * First-generation node graph editor. Drag nodes to reposition; pan the
 * viewport on background drag; wheel-zoom. Drag-to-connect ports + minimap
 * + auto-layout deferred.
 */
export const NodeEditor = forwardRef<HTMLDivElement, NodeEditorProps>(function NodeEditor(
  {
    nodes,
    edges = [],
    onNodesChange,
    onEdgeClick,
    renderNode,
    nodeWidth = 160,
    nodeHeight = 60,
    minZoom = 0.25,
    maxZoom = 2,
    className,
    ...rest
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const dragStateRef = useRef<
    | { kind: 'pan'; startX: number; startY: number; viewportX: number; viewportY: number }
    | { kind: 'node'; nodeId: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number }
    | null
  >(null);

  const nodeIndex = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const onContainerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    dragStateRef.current = {
      kind: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      viewportX: viewport.x,
      viewportY: viewport.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onContainerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.kind === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setViewport((v) => ({ ...v, x: drag.viewportX + dx, y: drag.viewportY + dy }));
    } else if (drag.kind === 'node') {
      const dx = (e.clientX - drag.startX) / viewport.zoom;
      const dy = (e.clientY - drag.startY) / viewport.zoom;
      const next = nodes.map((n) =>
        n.id === drag.nodeId ? { ...n, x: drag.nodeStartX + dx, y: drag.nodeStartY + dy } : n,
      );
      onNodesChange?.(next);
    }
  };

  const onContainerPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Zoom centered on the cursor.
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setViewport((v) => {
        const nextZoom = Math.max(minZoom, Math.min(maxZoom, v.zoom * factor));
        const ratio = nextZoom / v.zoom;
        return {
          zoom: nextZoom,
          x: cx - (cx - v.x) * ratio,
          y: cy - (cy - v.y) * ratio,
        };
      });
    },
    [minZoom, maxZoom],
  );

  const beginNodeDrag = (e: ReactPointerEvent<HTMLDivElement>, node: NodeEditorNode) => {
    e.stopPropagation();
    dragStateRef.current = {
      kind: 'node',
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const fitView = () => {
    if (nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + nodeWidth));
    const maxY = Math.max(...nodes.map((n) => n.y + nodeHeight));
    const w = maxX - minX;
    const h = maxY - minY;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const padding = 40;
    const zoomX = (rect.width - padding * 2) / w;
    const zoomY = (rect.height - padding * 2) / h;
    const zoom = Math.max(minZoom, Math.min(maxZoom, Math.min(zoomX, zoomY, 1)));
    setViewport({
      zoom,
      x: padding - minX * zoom + (rect.width - padding * 2 - w * zoom) / 2,
      y: padding - minY * zoom + (rect.height - padding * 2 - h * zoom) / 2,
    });
  };

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      onPointerDown={onContainerPointerDown}
      onPointerMove={onContainerPointerMove}
      onPointerUp={onContainerPointerUp}
      onPointerCancel={onContainerPointerUp}
      onWheel={onWheel}
      className={cn(
        'relative h-96 w-full overflow-hidden rounded-md border border-border bg-muted/30 select-none',
        className,
      )}
      {...rest}
    >
      {/* Pan/zoom transform */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        <svg
          className="absolute pointer-events-none"
          style={{ overflow: 'visible', width: '100%', height: '100%' }}
        >
          {edges.map((edge) => {
            const a = nodeIndex.get(edge.source);
            const b = nodeIndex.get(edge.target);
            if (!a || !b) return null;
            const x1 = a.x + nodeWidth;
            const y1 = a.y + nodeHeight / 2;
            const x2 = b.x;
            const y2 = b.y + nodeHeight / 2;
            const mid = (x1 + x2) / 2;
            const path = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={() => onEdgeClick?.(edge)}>
                <path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2 / viewport.zoom}
                  className="text-border-strong hover:text-primary"
                />
                {edge.label && (
                  <text
                    x={mid}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                    style={{ fontSize: 10 / viewport.zoom }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {nodes.map((node) => (
          <div
            key={node.id}
            data-node
            role="group"
            aria-label={typeof node.label === 'string' ? node.label : node.id}
            onPointerDown={(e) => beginNodeDrag(e, node)}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: nodeWidth,
              height: nodeHeight,
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            {renderNode ? (
              renderNode(node)
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm">
                {node.label ?? node.id}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() =>
            setViewport((v) => ({ ...v, zoom: Math.min(maxZoom, v.zoom * 1.2) }))
          }
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={Plus} size={14} />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() =>
            setViewport((v) => ({ ...v, zoom: Math.max(minZoom, v.zoom / 1.2) }))
          }
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={Minus} size={14} />
        </button>
        <button
          type="button"
          aria-label="Fit view"
          onClick={fitView}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={Maximize} size={12} />
        </button>
      </div>
    </div>
  );
});
