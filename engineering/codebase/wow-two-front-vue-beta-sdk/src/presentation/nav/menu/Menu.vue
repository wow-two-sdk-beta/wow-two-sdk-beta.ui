<script lang="ts">
import type { Placement } from '@floating-ui/vue';
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/styles';

/**
 * Represents the prop surface of `Menu`.
 *
 * React declared the surface axes by `extends SurfaceLayoutVariants`; they are
 * spelled out here because the SFC compiler's type resolver cannot follow a
 * `VariantProps<typeof …>` base and fails the build on it. The aliases below
 * are the canonical ones from `foundation/styles`, already locked against the
 * `surfaceVariants` config there, so the two cannot drift. `placement` is
 * `Placement` for the same reason — React read it back off `AnchoredPositioner`
 * with an indexed access, which the resolver cannot follow either.
 *
 * The accessible label is *not* a prop: a declared `'aria-label'` arrives as
 * `props.ariaLabel` and never renders. It stays a fallthrough attr and lands on
 * the menu surface through `v-bind="rest"` below.
 */
export interface MenuProps {
  /** Controlled axes use their canonical Vue model names; each update event requests caller state. */
  readonly open?: boolean;

  /** The element the surface anchors to. */
  readonly anchor: HTMLElement | null;

  /** The Floating UI placement. Default `bottom-start`. */
  readonly placement?: Placement;

  /** The distance between anchor and surface in px. Default 6. */
  readonly offset?: number;

  /** The visual recipe. Default `surface`. */
  readonly variant?: SurfaceVariant;

  /** The color tone the recipe is tinted with. */
  readonly tone?: SurfaceTone;

  /** The corner rounding. Default `md`. */
  readonly radius?: SurfaceRadius;

  /** The inner spacing step. Default `xs`. */
  readonly padding?: SurfacePadding;

  /** The shadow depth. */
  readonly elevation?: SurfaceElevation;

  /** Optional pre-gesture focus target, restored only while this menu owns focus. */
  readonly returnFocus?: () => HTMLElement | null;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/styles';
import { AnchoredPositioner, DismissableLayer, FocusScope, Portal, Presence } from '../../../foundation/primitives';
import { DomOrderExtensions } from '../../../foundation/dom';
import { useTypeahead } from '../../../foundation/selection';
import { MenuKey, type MenuItemEntry } from './MenuContext';
import { menuVariants } from './Menu.variants';

/** Renders the anchored, focus-trapped menu surface the arrow keys walk. */
defineOptions({ name: 'Menu', inheritAttrs: false });

/** The menu contents — `MenuItem` / `MenuGroup` / `MenuLabel` / `MenuSeparator`. React's `children`. */
defineSlots<{ default(): unknown }>();

/** `open` default to `undefined` so an absent prop cannot read as an explicit `false`. */
const props = withDefaults(defineProps<MenuProps>(), {
  open: undefined,
  placement: 'bottom-start',
  offset: 6,
  variant: undefined,
  tone: undefined,
  radius: undefined,
  padding: undefined,
  elevation: undefined,
});

const emit = defineEmits<{
  /** Fires when the menu should update:open — Escape, an outside pointerdown, Tab, or a selection. */
  'update:open': [open: boolean];

  /**
   * Fires when a key goes down on the menu container, ahead of the menu's own Tab
   * handling, so a wrapper (Menubar) can add navigation and opt out with `preventDefault()`.
   */
  keydown: [event: KeyboardEvent];
}>();

const attrs = useAttrs();

const isMenuOpen = computed(() => props.open ?? false);

/** The live item registry — a plain array, not reactive: the ordering is read imperatively. */
const items: Array<MenuItemEntry> = [];

function registerItem(entry: MenuItemEntry): void {
  const index = items.findIndex((i) => i.id === entry.id);
  if (index >= 0) items[index] = entry;
  else items.push(entry);
}

function unregisterItem(id: string): void {
  const index = items.findIndex((i) => i.id === id);
  if (index >= 0) items.splice(index, 1);
}

provide(MenuKey, { registerItem, unregisterItem, items, close: () => emit('update:open', false) });

const classes = computed(() =>
  cn(
    surfaceVariants({
      variant: props.variant ?? 'surface',
      tone: props.tone,
      radius: props.radius ?? 'md',
      padding: props.padding ?? 'xs',
      elevation: props.elevation,
    }),
    menuVariants(),
    'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
    'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
    'motion-reduce:animate-none',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. Carries `aria-label` onto the surface. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

function handleEscape(): void {
  emit('update:open', false);
}

function handleOutsidePointerDown(event: PointerEvent): void {
  if (props.anchor?.contains(event.target as Node)) return;
  emit('update:open', false);
}

const orderedItems = () => DomOrderExtensions.inDocumentOrder(items, (item) => item.el);
const typeahead = useTypeahead({
  items: orderedItems,
  enabled: isMenuOpen,
  getLabel: (item) => item.el?.textContent?.trim() ?? '',
  isDisabled: (item) => item.disabled || !item.el?.isConnected,
  getActiveIndex: () => orderedItems().findIndex((item) => item.el === item.el?.ownerDocument.activeElement),
  onMatch: (item) => item.el?.focus(),
});

function handleKeydown(event: KeyboardEvent): void {
  emit('keydown', event);
  if (event.defaultPrevented || event.isComposing) return;
  const target = event.target as HTMLElement;
  if (!target.closest('input,textarea,[contenteditable="true"]') && typeahead.onKeyDown(event)) {
    event.preventDefault();
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    emit('update:open', false);
  }
}
</script>

<template>
  <!-- No hard `v-if="isMenuOpen"` — Presence keeps the surface mounted through its
       pop-out exit, flipping data-state to "closed" and deferring unmount until the
       animation ends. `FocusScope as-child` relays Presence's cloned `ref` +
       `data-state` down onto the DismissableLayer's div, which *is* the surface. -->
  <Portal>
    <AnchoredPositioner :anchor="props.anchor" :placement="props.placement" :offset="props.offset" class="z-dropdown">
      <Presence :is-present="isMenuOpen">
        <FocusScope as-child trapped loop :return-focus="props.returnFocus">
          <DismissableLayer
            role="menu"
            :on-escape="handleEscape"
            :on-outside-pointer-down="handleOutsidePointerDown"
            v-bind="rest"
            :class="classes"
            @keydown="handleKeydown"
          >
            <slot />
          </DismissableLayer>
        </FocusScope>
      </Presence>
    </AnchoredPositioner>
  </Portal>
</template>
