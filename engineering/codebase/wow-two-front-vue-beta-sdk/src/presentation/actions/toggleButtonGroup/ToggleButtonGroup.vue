<script lang="ts">
import type { HTMLAttributes } from 'vue';
import type { Orientation } from '../../../foundation/utils';
import type {
  ToggleButtonGroupVariant,
  ToggleItemRole,
  ToggleMode,
} from './ToggleButtonGroup.variants';

/**
 * Props for the group, generic over the value type `T`.
 *
 * `T` defaults to `string`, so untyped usage keeps the historical `string | null`
 * shape. Pass a string-literal union or string enum
 * (`<ToggleButtonGroup<GradientType> …>`) to have `value` / `@value-change` emit
 * that narrowed type instead — no cast needed at the call site.
 *
 * Divergence from the React original: there, `type` discriminated a `SingleProps<T>`
 * / `MultiProps` union, so single mode saw `T | null` and multi mode `readonly
 * string[]`. Vue's prop compiler flattens a union type into one merged prop set, so
 * `value` / `defaultValue` carry both shapes and the mode still decides which is
 * live at runtime.
 */
export interface ToggleButtonGroupProps<T extends string = string>
  extends /* @vue-ignore */ Omit<HTMLAttributes, 'defaultValue' | 'onChange'> {
  /** The selection cardinality — omit or `ToggleMode.Single` for at-most-one, `ToggleMode.Multi` for any-number-active. */
  type?: ToggleMode;

  /** The controlled value — `T | null` in single mode, a string array in multi mode. */
  value?: T | null | ReadonlyArray<string>;

  /** The uncontrolled initial value. Ignored once `value` is set. */
  defaultValue?: T | null | ReadonlyArray<string>;

  /** The layout axis of the button row/column. @default Orientation.Horizontal */
  orientation?: Orientation;

  /** The attached state — collapses inner radii into a connected row/column. @default true */
  isAttached?: boolean;

  /**
   * The visual style.
   * - `default` — standard button row/column (borders + attached radii).
   * - `segmented` — iOS-style connected pill row on a muted track; the active
   *   segment lifts to a `background` surface. Forces `isAttached`.
   * - `pill` — individually-separated rounded pills (each item its own detached
   *   chip). Forces detached (never attaches).
   */
  variant?: ToggleButtonGroupVariant;

  /**
   * The ARIA role wiring.
   * - `group` (default) — `role="group"` of independent toggle buttons.
   * - `tab` — opt into tablist semantics: root renders `role="tablist"` and each
   *   item `role="tab"` + `aria-selected`. Pairs naturally with single-select.
   * @default ToggleItemRole.Group
   */
  itemRole?: ToggleItemRole;

  /**
   * The equal-width state — lays items out as equal-width tiles (each `flex-1 basis-0`)
   * for an icon category strip where every cell should share the row width. Additive;
   * the default keeps intrinsic item widths.
   * @default false
   */
  equalWidth?: boolean;
}
</script>

<script setup lang="ts" generic="T extends string = string">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Orientation as OrientationValue } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { ToggleButtonGroupKey } from './ToggleButtonGroupContext';
import {
  ToggleButtonGroupVariant as ToggleButtonGroupVariantValue,
  ToggleItemRole as ToggleItemRoleValue,
  ToggleMode as ToggleModeValue,
} from './ToggleButtonGroup.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ToggleButtonGroup', inheritAttrs: false });

const props = withDefaults(defineProps<ToggleButtonGroupProps<T>>(), {
  orientation: OrientationValue.Horizontal,
  isAttached: true,
  variant: ToggleButtonGroupVariantValue.Default,
  itemRole: ToggleItemRoleValue.Group,
  equalWidth: false,
  type: undefined,
  value: undefined,
  defaultValue: undefined,
});

const emit = defineEmits<{
  /** Emits the selection whenever it changes — `T | null` in single mode, the full array in multi mode. */
  'value-change': [value: T | null | ReadonlyArray<string>];
}>();

const attrs = useAttrs();

const mode = computed(() =>
  props.type === ToggleModeValue.Multi ? ToggleModeValue.Multi : ToggleModeValue.Single,
);
const isSegmented = computed(() => props.variant === ToggleButtonGroupVariantValue.Segmented);
const isPill = computed(() => props.variant === ToggleButtonGroupVariantValue.Pill);
const isTablist = computed(() => props.itemRole === ToggleItemRoleValue.Tab);
const isHorizontal = computed(() => props.orientation === OrientationValue.Horizontal);
// Segmented is inherently an attached pill row — the muted track only reads as one control when its
// segments touch. Pill is the inverse — always detached chips, never attached.
const attached = computed(() =>
  isPill.value ? false : isSegmented.value || props.isAttached,
);

const { value: singleValue, setValue: setSingleValue } = useControlled<string | null>({
  controlled: () =>
    mode.value === ToggleModeValue.Single ? (props.value as string | null | undefined) : undefined,
  default:
    props.type !== ToggleModeValue.Multi
      ? ((props.defaultValue as string | null | undefined) ?? null)
      : null,
  onChange: (next) => {
    if (mode.value === ToggleModeValue.Single) emit('value-change', next as T | null);
  },
});

const { value: multiValue, setValue: setMultiValue } = useControlled<ReadonlyArray<string>>({
  controlled: () =>
    mode.value === ToggleModeValue.Multi
      ? (props.value as ReadonlyArray<string> | undefined)
      : undefined,
  default:
    props.type === ToggleModeValue.Multi
      ? ((props.defaultValue as ReadonlyArray<string> | undefined) ?? [])
      : [],
  onChange: (next) => {
    if (mode.value === ToggleModeValue.Multi) emit('value-change', next);
  },
});

function isPressed(childValue: string | undefined): boolean {
  if (childValue === undefined) return false;
  return mode.value === ToggleModeValue.Single
    ? singleValue.value === childValue
    : multiValue.value.includes(childValue);
}

function togglePressed(childValue: string | undefined): void {
  if (childValue === undefined) return;
  if (mode.value === ToggleModeValue.Single) {
    setSingleValue(singleValue.value === childValue ? null : childValue);
  } else {
    setMultiValue(
      multiValue.value.includes(childValue)
        ? multiValue.value.filter((entry) => entry !== childValue)
        : [...multiValue.value, childValue],
    );
  }
}

/* Each `ToggleButton` child reads its own slice off this — the provide/inject replacement for the
   original's `Children.map` + `cloneElement`. `itemRole` is a live getter, not a snapshot. */
provide(ToggleButtonGroupKey, {
  isPressed,
  toggle: togglePressed,
  get itemRole() {
    return props.itemRole;
  },
});

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'inline-flex',
    isHorizontal.value ? 'flex-row' : 'flex-col',
    attached.value
      ? isHorizontal.value
        ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
        : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
      : 'gap-2',
    // Segmented: muted track + reset segment chrome; active segment lifts to a `background` surface.
    isSegmented.value && [
      'rounded-md bg-muted p-1',
      '[&>*]:!rounded-md [&>*]:!ml-0 [&>*]:!border-transparent [&>*]:!bg-transparent',
      '[&>*[data-pressed=true]]:!bg-background [&>*[data-pressed=true]]:!text-foreground [&>*[data-pressed=true]]:shadow-sm',
    ],
    // Pill: fully-rounded detached chips (gap already applied via the non-attached branch above).
    isPill.value && '[&>*]:!rounded-full',
    // Equal-width tiles: every item shares the row/column extent (icon category strip).
    props.equalWidth && '[&>*]:flex-1 [&>*]:basis-0',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <!-- Coordinates a row/column of ToggleButton children — `type="single" | "multi"`. -->
  <div
    ref="root"
    :role="isTablist ? 'tablist' : 'group'"
    :aria-orientation="isTablist ? orientation : undefined"
    :data-orientation="orientation"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </div>
</template>
