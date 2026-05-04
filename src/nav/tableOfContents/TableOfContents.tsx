import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../../utils';
import { useScrollSpy } from '../scrollSpy/ScrollSpy';

export interface TableOfContentsItem {
  id: string;
  label: ReactNode;
  /** Indent level. 0 = top, 1 = nested, … */
  depth?: number;
}

export interface TableOfContentsProps extends HTMLAttributes<HTMLElement> {
  items?: TableOfContentsItem[];
  /** Auto-extract from this element's headings. */
  source?: RefObject<HTMLElement>;
  /** CSS selector used with `source`. Default `h2, h3`. */
  headingSelector?: string;
  /** Override the auto-derived active id. */
  activeId?: string | null;
  /** Apply `sticky top-4 self-start` helper classes. */
  sticky?: boolean;
}

function depthFromTagName(tag: string): number {
  const match = /^H([1-6])$/i.exec(tag);
  return match ? Number(match[1]) - 2 : 0; // h2 → 0, h3 → 1, h4 → 2
}

/**
 * Outline of headings — `items` (explicit) or `source` (auto-extract).
 * Active entry derived from `useScrollSpy` over the headings' IDs.
 */
export const TableOfContents = forwardRef<HTMLElement, TableOfContentsProps>(
  function TableOfContents(
    {
      items: itemsProp,
      source,
      headingSelector = 'h2, h3',
      activeId: activeIdProp,
      sticky,
      className,
      ...rest
    },
    ref,
  ) {
    const [extracted, setExtracted] = useState<TableOfContentsItem[]>([]);

    useEffect(() => {
      if (itemsProp || !source?.current) return;
      const root = source.current;
      const headings = Array.from(root.querySelectorAll<HTMLElement>(headingSelector));
      const list = headings
        .filter((h) => h.id)
        .map((h) => ({
          id: h.id,
          label: h.textContent ?? '',
          depth: Math.max(0, depthFromTagName(h.tagName)),
        }));
      setExtracted(list);
    }, [itemsProp, source, headingSelector]);

    const items = itemsProp ?? extracted;
    const ids = useMemo(() => items.map((i) => i.id), [items]);
    const spyId = useScrollSpy(ids);
    const activeId = activeIdProp !== undefined ? activeIdProp : spyId;

    if (items.length === 0) return null;

    return (
      <nav
        ref={ref}
        aria-label="Table of contents"
        className={cn(sticky && 'sticky top-4 self-start', className)}
        {...rest}
      >
        <ul className="space-y-1 text-sm">
          {items.map((item) => {
            const isActive = item.id === activeId;
            const depth = item.depth ?? 0;
            return (
              <li
                key={item.id}
                style={{ paddingLeft: depth * 12 }}
              >
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    'block rounded-sm px-2 py-1 transition-colors',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);
