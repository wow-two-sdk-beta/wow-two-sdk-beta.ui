import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'onChange'> {
  /** Total page count (1-based). */
  total: number;
  /** Current page (1-based). */
  page: number;
  /** Fires with the new page on click. */
  onPageChange: (page: number) => void;
  /** Number of page buttons surrounding the current. Default `1` (so 1 + current + 1 = 3). */
  siblings?: number;
  /** Hide first/last buttons (just show prev/next + numbers). */
  hideFirstLast?: boolean;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(total: number, page: number, siblings: number): (number | 'ellipsis')[] {
  if (total <= 1) return [1];
  const left = Math.max(2, page - siblings);
  const right = Math.min(total - 1, page + siblings);
  const pages: (number | 'ellipsis')[] = [1];
  if (left > 2) pages.push('ellipsis');
  pages.push(...range(left, right));
  if (right < total - 1) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

/**
 * Compact page-number row with prev/next + ellipses for skipped ranges.
 * Stateless — consumer drives `page` and reacts to `onPageChange`.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    { total, page, onPageChange, siblings = 1, className, ...props },
    ref,
  ) => {
    const pages = buildPages(total, page, siblings);
    const go = (p: number) => onPageChange(Math.min(total, Math.max(1, p)));

    const baseBtn =
      'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-transparent px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

    return (
      <nav ref={ref} aria-label="Pagination" className={cn('inline-flex items-center gap-1', className)} {...props}>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          className={cn(baseBtn, 'hover:bg-muted')}
        >
          <Icon icon={ChevronLeft} size={16} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => go(p)}
              className={cn(
                baseBtn,
                p === page ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= total}
          onClick={() => go(page + 1)}
          className={cn(baseBtn, 'hover:bg-muted')}
        >
          <Icon icon={ChevronRight} size={16} />
        </button>
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';
