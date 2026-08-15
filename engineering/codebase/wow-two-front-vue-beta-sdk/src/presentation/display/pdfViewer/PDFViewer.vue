<script lang="ts">
export interface PDFViewerProps {
  /** The PDF URL. */
  src: string;
  /** The controlled page number (1-based). */
  page?: number;
  /** The uncontrolled initial page. Default `1`. */
  defaultPage?: number;
  /** The controlled zoom percentage. */
  zoom?: number;
  /** The uncontrolled initial zoom percentage. Default `100`. */
  defaultZoom?: number;
  /** The total page count, when known — enables `n / total` and clamps `next`. */
  pageCount?: number;
  /** The iframe title. Default `PDF document`. */
  title?: string;
  /** The download-link state. Default `true`. */
  canDownload?: boolean;
  /** The CSS height of the document area. Default `70vh`. */
  height?: string;
}

const ZOOM_LEVELS: ReadonlyArray<number> = [50, 75, 100, 125, 150, 175, 200, 250, 300, 400];
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';

/**
 * Inline PDF viewer. **First-gen** uses the browser's built-in PDF viewer via
 * an `<iframe>` with `#page=N&zoom=Z` URL hash. Real per-page rendering,
 * thumbnails, search, annotations all need a PDF.js wrap — deferred to a
 * follow-up that slots into this contract.
 */
defineOptions({ name: 'PDFViewer', inheritAttrs: false });

const props = withDefaults(defineProps<PDFViewerProps>(), {
  page: undefined,
  defaultPage: 1,
  zoom: undefined,
  defaultZoom: 100,
  pageCount: undefined,
  title: 'PDF document',
  canDownload: true,
  height: '70vh',
});

const emit = defineEmits<{
  /** Fires with the next page number. */
  'page-change': [page: number];
  /** Fires with the next zoom percentage. */
  'zoom-change': [zoom: number];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const { value: page, setValue: setPage } = useControlled<number>({
  controlled: () => props.page,
  default: props.defaultPage,
  onChange: (next) => emit('page-change', next),
});

const { value: zoom, setValue: setZoom } = useControlled<number>({
  controlled: () => props.zoom,
  default: props.defaultZoom,
  onChange: (next) => emit('zoom-change', next),
});

// Build URL with hash for page/zoom hint to native PDF viewer.
const hashedSrc = computed(() => {
  try {
    const url = new URL(props.src, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    url.hash = `page=${page.value}&zoom=${zoom.value}`;
    return url.toString();
  } catch {
    return `${props.src}#page=${page.value}&zoom=${zoom.value}`;
  }
});

const minZoom = computed(() => ZOOM_LEVELS[0]!);
const maxZoom = computed(() => ZOOM_LEVELS[ZOOM_LEVELS.length - 1]!);

function goPrev(): void {
  setPage(Math.max(1, page.value - 1));
}

function goNext(): void {
  setPage(props.pageCount ? Math.min(props.pageCount, page.value + 1) : page.value + 1);
}

function zoomIn(): void {
  const next = ZOOM_LEVELS.find((level) => level > zoom.value);
  if (next) setZoom(next);
}

function zoomOut(): void {
  const next = [...ZOOM_LEVELS].reverse().find((level) => level < zoom.value);
  if (next) setZoom(next);
}

const classes = computed(() =>
  cn(
    'flex flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm',
    attrs.class as string | undefined,
  ),
);

/** Vue does not append `px` to a numeric `:style` value the way React does — spelled out. */
const frameStyle = computed(() => ({ height: props.height, border: '0' }));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes">
    <div class="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
      <button
        type="button"
        aria-label="Previous page"
        :disabled="page <= 1"
        class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        @click="goPrev"
      >
        <Icon :icon="ChevronLeft" :size="14" />
      </button>
      <span class="px-1 text-xs tabular-nums text-foreground">{{
        pageCount ? `${page} / ${pageCount}` : `Page ${page}`
      }}</span>
      <button
        type="button"
        aria-label="Next page"
        :disabled="pageCount != null && page >= pageCount"
        class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        @click="goNext"
      >
        <Icon :icon="ChevronRight" :size="14" />
      </button>
      <span class="mx-2 h-4 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        aria-label="Zoom out"
        :disabled="zoom <= minZoom"
        class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        @click="zoomOut"
      >
        <Icon :icon="ZoomOut" :size="14" />
      </button>
      <span class="px-1 text-xs tabular-nums text-foreground">{{ zoom }}%</span>
      <button
        type="button"
        aria-label="Zoom in"
        :disabled="zoom >= maxZoom"
        class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        @click="zoomIn"
      >
        <Icon :icon="ZoomIn" :size="14" />
      </button>
      <div class="ml-auto flex items-center gap-1">
        <a
          v-if="canDownload"
          :href="src"
          download
          aria-label="Download PDF"
          class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon :icon="Download" :size="14" />
        </a>
      </div>
    </div>
    <iframe :src="hashedSrc" :title="title" :style="frameStyle" class="w-full bg-muted" />
  </div>
</template>
