<script lang="ts">
import { inject, type InjectionKey } from 'vue';
/* `Orientation` is imported as a value so the one binding serves as both the
   type below and the runtime default in `withDefaults`. */
import { Orientation } from '../../../foundation/utils';

/** The size constraints a `ResizablePanel` contributes to its group. */
export interface PanelInfo {
  defaultSize: number;
  minSize: number;
  maxSize: number;
}

/**
 * The group context. Every member is a live getter or a method — read them,
 * never destructure, or the reactivity is lost at the point of the snapshot.
 */
export interface ResizableContextValue {
  readonly orientation: Orientation;
  readonly sizes: ReadonlyArray<number>;
  readonly panels: ReadonlyArray<PanelInfo>;

  /**
   * Registration replaces React's `Children.map` index threading: a Vue parent
   * cannot rewrite its slot's children, so each child claims its own slot with an
   * identity token. Order is *registration* order — the same model the house
   * `createCollection` primitive uses — which equals document order for mount,
   * append, and remove.
   */
  registerPanel: (token: symbol, info: PanelInfo) => void;
  updatePanel: (token: symbol, info: PanelInfo) => void;
  unregisterPanel: (token: symbol) => void;
  panelIndex: (token: symbol) => number;

  registerSeparator: (token: symbol) => void;
  unregisterSeparator: (token: symbol) => void;
  separatorIndex: (token: symbol) => number;

  beginDrag: (separatorIndex: number, event: MouseEvent) => void;
  nudge: (separatorIndex: number, deltaPct: number) => void;
  resetPair: (separatorIndex: number) => void;
}

export const resizableContextKey: InjectionKey<ResizableContextValue> =
  Symbol('wow-two.resizablePanels');

export function useResizableContext(): ResizableContextValue {
  const context = inject(resizableContextKey, null);
  if (!context) throw new Error('ResizablePanels.* must be used inside <ResizablePanels>');
  return context;
}

export interface ResizablePanelsProps {
  /** The split axis — `horizontal` (side-by-side panels) or `vertical` (stacked). Default `horizontal`. */
  orientation?: Orientation;
  defaultSizes?: ReadonlyArray<number>;
  sizes?: ReadonlyArray<number>;
  onSizesChange?: (sizes: ReadonlyArray<number>) => void;
}
</script>

<script setup lang="ts">
import { computed, onScopeDispose, provide, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';

/**
 * Two-or-more resizable panes split by draggable separators. Compose
 * `<ResizablePanel>` and `<ResizableSeparator>` as children — each claims its
 * index from this root through the injected context.
 */
defineOptions({ name: 'ResizablePanels', inheritAttrs: false });

/** The panels and separators — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ResizablePanelsProps>(), {
  orientation: Orientation.Horizontal,
  defaultSizes: undefined,
  sizes: undefined,
  onSizesChange: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

interface PanelEntry {
  token: symbol;
  info: PanelInfo;
}

const panelEntries = ref<Array<PanelEntry>>([]);
const separatorTokens = ref<Array<symbol>>([]);
const panelCount = computed(() => panelEntries.value.length);

const controlled = useControlled<ReadonlyArray<number>>({
  controlled: () => props.sizes,
  default: props.defaultSizes ?? [],
  onChange: (next) => props.onSizesChange?.(next),
});

/**
 * React counted its panels before the first render (`Children.forEach`) and
 * seeded state from that. Children register *after* this setup, so the seed is
 * applied here instead — and the same watcher covers React's "panel count
 * changed → reset to equal sizes" effect.
 */
watch(
  panelCount,
  (count) => {
    if (controlled.value.value.length === count) return;
    if (props.defaultSizes && props.defaultSizes.length === count) {
      controlled.setValue(props.defaultSizes);
      return;
    }
    controlled.setValue(Array<number>(count).fill(100 / Math.max(count, 1)));
  },
  { immediate: true },
);

function findPanel(index: number): PanelInfo | undefined {
  return panelEntries.value[index]?.info;
}

function applyDelta(separatorIndex: number, deltaPct: number): void {
  const a = separatorIndex;
  const b = separatorIndex + 1;
  const aInfo = findPanel(a);
  const bInfo = findPanel(b);
  if (!aInfo || !bInfo) return;
  const next = controlled.value.value.slice();
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
  controlled.setValue(next);
}

let dragCleanup: (() => void) | null = null;

// Unmounting mid-drag must release the window listeners + body style overrides.
onScopeDispose(() => dragCleanup?.());

function beginDrag(separatorIndex: number, event: MouseEvent): void {
  const container = el.value;
  if (!container) return;
  const startX = event.clientX;
  const startY = event.clientY;
  const rect = container.getBoundingClientRect();
  const total = props.orientation === Orientation.Horizontal ? rect.width : rect.height;
  if (total === 0) return;

  const startSizes = controlled.value.value.slice();

  const onMove = (e: MouseEvent): void => {
    const deltaPx =
      props.orientation === Orientation.Horizontal ? e.clientX - startX : e.clientY - startY;
    const deltaPct = (deltaPx / total) * 100;
    // Recompute against the start state, not the live state, to prevent drift.
    const a = separatorIndex;
    const b = separatorIndex + 1;
    const aInfo = findPanel(a);
    const bInfo = findPanel(b);
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
    controlled.setValue(next);
  };

  const onUp = (): void => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    dragCleanup = null;
  };

  document.body.style.cursor =
    props.orientation === Orientation.Horizontal ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  dragCleanup = onUp;
}

function resetPair(separatorIndex: number): void {
  const a = separatorIndex;
  const b = separatorIndex + 1;
  const aInfo = findPanel(a);
  const bInfo = findPanel(b);
  if (!aInfo || !bInfo) return;
  const next = controlled.value.value.slice();
  const total = next[a]! + next[b]!;
  next[a] = (total * aInfo.defaultSize) / (aInfo.defaultSize + bInfo.defaultSize);
  next[b] = total - next[a]!;
  controlled.setValue(next);
}

provide(resizableContextKey, {
  get orientation() {
    return props.orientation;
  },
  get sizes() {
    return controlled.value.value;
  },
  get panels() {
    return panelEntries.value.map((entry) => entry.info);
  },
  registerPanel: (token, info) => {
    panelEntries.value = [...panelEntries.value, { token, info }];
  },
  updatePanel: (token, info) => {
    panelEntries.value = panelEntries.value.map((entry) =>
      entry.token === token ? { token, info } : entry,
    );
  },
  unregisterPanel: (token) => {
    panelEntries.value = panelEntries.value.filter((entry) => entry.token !== token);
  },
  panelIndex: (token) => panelEntries.value.findIndex((entry) => entry.token === token),
  registerSeparator: (token) => {
    separatorTokens.value = [...separatorTokens.value, token];
  },
  unregisterSeparator: (token) => {
    separatorTokens.value = separatorTokens.value.filter((existing) => existing !== token);
  },
  separatorIndex: (token) => separatorTokens.value.indexOf(token),
  beginDrag,
  nudge: applyDelta,
  resetPair,
});

const classes = computed(() =>
  cn(
    'flex h-full w-full',
    props.orientation === Orientation.Horizontal ? 'flex-row' : 'flex-col',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" :data-orientation="props.orientation" v-bind="rest" :class="classes">
    <slot />
  </div>
</template>
