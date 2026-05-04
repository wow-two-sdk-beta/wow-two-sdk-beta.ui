import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';

export interface PDFViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  src: string;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  zoom?: number;
  defaultZoom?: number;
  onZoomChange?: (zoom: number) => void;
  pageCount?: number;
  title?: string;
  download?: boolean;
  height?: string;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 250, 300, 400];

/**
 * Inline PDF viewer. **First-gen** uses the browser's built-in PDF viewer via
 * an `<iframe>` with `#page=N&zoom=Z` URL hash. Real per-page rendering,
 * thumbnails, search, annotations all need a PDF.js wrap — deferred to a
 * follow-up that slots into this contract.
 */
export const PDFViewer = forwardRef<HTMLDivElement, PDFViewerProps>(function PDFViewer(
  {
    src,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    zoom: zoomProp,
    defaultZoom = 100,
    onZoomChange,
    pageCount,
    title = 'PDF document',
    download = true,
    height = '70vh',
    className,
    ...rest
  },
  ref,
) {
  const [page, setPage] = useControlled({
    controlled: pageProp,
    default: defaultPage,
    onChange: onPageChange,
  });
  const [zoom, setZoom] = useControlled({
    controlled: zoomProp,
    default: defaultZoom,
    onChange: onZoomChange,
  });

  // Build URL with hash for page/zoom hint to native PDF viewer.
  const hashedSrc = useMemo(() => {
    try {
      const url = new URL(src, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
      url.hash = `page=${page}&zoom=${zoom}`;
      return url.toString();
    } catch {
      return `${src}#page=${page}&zoom=${zoom}`;
    }
  }, [src, page, zoom]);

  const goPrev = () => setPage(Math.max(1, page - 1));
  const goNext = () => setPage(pageCount ? Math.min(pageCount, page + 1) : page + 1);
  const zoomIn = () => {
    const next = ZOOM_LEVELS.find((z) => z > zoom);
    if (next) setZoom(next);
  };
  const zoomOut = () => {
    const next = [...ZOOM_LEVELS].reverse().find((z) => z < zoom);
    if (next) setZoom(next);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={goPrev}
          disabled={page <= 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon icon={ChevronLeft} size={14} />
        </button>
        <span className="px-1 text-xs tabular-nums text-foreground">
          {pageCount ? `${page} / ${pageCount}` : `Page ${page}`}
        </span>
        <button
          type="button"
          aria-label="Next page"
          onClick={goNext}
          disabled={pageCount != null && page >= pageCount}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon icon={ChevronRight} size={14} />
        </button>
        <span className="mx-2 h-4 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_LEVELS[0]!}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon icon={ZoomOut} size={14} />
        </button>
        <span className="px-1 text-xs tabular-nums text-foreground">{zoom}%</span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]!}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Icon icon={ZoomIn} size={14} />
        </button>
        <div className="ml-auto flex items-center gap-1">
          {download && (
            <a
              href={src}
              download
              aria-label="Download PDF"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon icon={Download} size={14} />
            </a>
          )}
        </div>
      </div>
      <iframe
        src={hashedSrc}
        title={title}
        style={{ height, border: 0 }}
        className="w-full bg-muted"
      />
    </div>
  );
});
