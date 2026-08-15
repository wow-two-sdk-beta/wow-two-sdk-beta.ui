<script lang="ts">
import { inject, type ComputedRef, type InjectionKey, type Ref } from 'vue';

/** Defines the responsive breakpoint at which `AppShell` collapses its sidebar / aside. */
export const Breakpoint = {
  /** Refers to the `sm` (640px) breakpoint. */
  Sm: 'sm',
  /** Refers to the `md` (768px) breakpoint. */
  Md: 'md',
  /** Refers to the `lg` (1024px) breakpoint. */
  Lg: 'lg',
  /** Refers to the `xl` (1280px) breakpoint. */
  Xl: 'xl',
  /** Refers to the `2xl` (1536px) breakpoint. */
  Xxl: '2xl',
} as const;

export type Breakpoint = (typeof Breakpoint)[keyof typeof Breakpoint];

const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * The value shared with `AppShellSidebar` / `AppShellAside`.
 *
 * React's context held plain values re-created on every render behind a
 * `useMemo`; here every field stays a ref or a computed, so a child reads the
 * live value and the root never re-renders to publish one.
 */
export interface AppShellContextValue {
  sidebarWidth: ComputedRef<string>;
  asideWidth: ComputedRef<string>;
  sidebarBreakpoint: ComputedRef<Breakpoint>;
  /** The resolved mobile-sidebar open state. Writable — an assignment routes through `setSidebarOpen`. */
  isSidebarOpen: Ref<boolean>;
  setSidebarOpen: (open: boolean) => void;
  /** True below `sidebarBreakpoint` — the sidebar renders as a `Drawer`. */
  isSidebarCollapsed: ComputedRef<boolean>;
  /** True below `asideBreakpoint` — the aside renders nothing. */
  isAsideHidden: ComputedRef<boolean>;
}

export const appShellContextKey: InjectionKey<AppShellContextValue> = Symbol('wow-two.appShell');

export function useAppShellContext(): AppShellContextValue {
  const context = inject(appShellContextKey, null);
  if (!context) throw new Error('AppShell.* must be used inside <AppShell>');
  return context;
}

/** Reads the enclosing `AppShell`'s state — widths, breakpoint, and the mobile-sidebar toggle. */
export function useAppShell(): AppShellContextValue {
  return useAppShellContext();
}

/**
 * The prop surface of `AppShell`.
 *
 * `sidebarOpen` and `isSidebarOpen` are the same controlled state under two
 * names: `sidebarOpen` is the `v-model:sidebarOpen` binding target,
 * `isSidebarOpen` React's spelling. `isSidebarOpen` wins when both are set —
 * React's name always resolves first, so an explicit binding is never
 * swallowed by a `v-model` that is also present.
 * React's `onSidebarOpenChange` is the `sidebar-open-change` emit;
 * `update:sidebarOpen` fires alongside it so `v-model` works.
 */
export interface AppShellProps {
  /** The sidebar column width, any CSS length. Default `240px`. */
  sidebarWidth?: string;

  /** The aside rail width, any CSS length. Default `280px`. */
  asideWidth?: string;

  /** The sidebar collapses below this breakpoint. Default `lg`. */
  sidebarBreakpoint?: Breakpoint;

  /** The aside hides below this breakpoint. Default `xl`. */
  asideBreakpoint?: Breakpoint;

  /** The mobile-sidebar open state, controlled. The `v-model:sidebarOpen` binding target. */
  sidebarOpen?: boolean;

  /** The mobile-sidebar open state, controlled — React's spelling, which wins when both are set. */
  isSidebarOpen?: boolean;

  /** The initial mobile-sidebar state when uncontrolled. Default `false`. */
  defaultSidebarOpen?: boolean;
}
</script>

<script setup lang="ts">
import { computed, normalizeStyle, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled, useMediaQuery } from '../../../foundation/hooks';

/**
 * Top-level page frame. Children: `AppShellHeader` / `AppShellSidebar` /
 * `AppShellMain` / `AppShellAside` / `AppShellFooter`. CSS-grid layout; the
 * sidebar collapses to a `Drawer` below `sidebarBreakpoint`.
 */
defineOptions({ name: 'AppShell', inheritAttrs: false });

/** The shell's regions — React's required `children`. */
defineSlots<{ default(): unknown }>();

/**
 * `sidebarOpen: undefined` / `isSidebarOpen: undefined` are load-bearing: Vue
 * coerces an absent `Boolean` prop to `false` unless the declaration *owns* a
 * `default` key, which would strand the uncontrolled path behind a
 * permanently-closed controlled one.
 */
const props = withDefaults(defineProps<AppShellProps>(), {
  sidebarWidth: '240px',
  asideWidth: '280px',
  sidebarBreakpoint: 'lg',
  asideBreakpoint: 'xl',
  sidebarOpen: undefined,
  isSidebarOpen: undefined,
  defaultSidebarOpen: false,
});

const emit = defineEmits<{
  /** The `v-model:sidebarOpen` half. */
  'update:sidebarOpen': [open: boolean];
  /** Replaces React's `onSidebarOpenChange`. */
  'sidebar-open-change': [open: boolean];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const controlled = useControlled<boolean>({
  controlled: () => (props.isSidebarOpen !== undefined ? props.isSidebarOpen : props.sidebarOpen),
  default: () => props.defaultSidebarOpen,
  onChange: (value) => {
    emit('update:sidebarOpen', value);
    emit('sidebar-open-change', value);
  },
});

const isSidebarWide = useMediaQuery(() => `(min-width: ${BREAKPOINT_PX[props.sidebarBreakpoint]}px)`);
const isAsideWide = useMediaQuery(() => `(min-width: ${BREAKPOINT_PX[props.asideBreakpoint]}px)`);

const isSidebarCollapsed = computed(() => !isSidebarWide.value);
const isAsideHidden = computed(() => !isAsideWide.value);

provide(appShellContextKey, {
  sidebarWidth: computed(() => props.sidebarWidth),
  asideWidth: computed(() => props.asideWidth),
  sidebarBreakpoint: computed(() => props.sidebarBreakpoint),
  isSidebarOpen: controlled.value,
  setSidebarOpen: controlled.setValue,
  isSidebarCollapsed,
  isAsideHidden,
});

/** Collapsed drops the sidebar track entirely; header and footer always span the full width. */
const gridTemplate = computed(() =>
  isSidebarCollapsed.value
    ? `'header header' auto 'main main' 1fr 'footer footer' auto / 1fr`
    : `'header header' auto 'sidebar main' 1fr 'sidebar footer' auto / ${props.sidebarWidth} 1fr`,
);

const classes = computed(() => cn('grid min-h-svh bg-background text-foreground', attrs.class as string | undefined));

/** `gridTemplate` is normalized first so a caller's `style` still wins per-property. */
const rootStyle = computed(() => normalizeStyle([{ gridTemplate: gridTemplate.value }, attrs.style]));

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :style="rootStyle" :class="classes">
    <a
      href="#app-shell-main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-modal focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
    >
      Skip to content
    </a>
    <slot />
  </div>
</template>
