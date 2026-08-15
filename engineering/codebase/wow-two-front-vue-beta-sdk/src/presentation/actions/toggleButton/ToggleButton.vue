<script lang="ts">
import type { VNodeChild } from 'vue';
import type { ColorProp, ColorTone } from '../../../foundation/utils';
import type { ButtonProps } from '../button';
import type { ToggleButtonElement, ToggleButtonVariant, ToggleButtonVariants } from './ToggleButton.variants';

/* Fn signature for state-aware string props. */
type PressedFn<T> = (args: { pressed: boolean }) => T;
type StateAware<T> = T | PressedFn<T>;

/* `ButtonProps` and `ToggleButtonVariants` are `@vue-ignore`d: everything not declared below
   flows to the underlying `Button` through attribute fallthrough (the counterpart of the
   original's `{...buttonProps}` spread), and `ToggleButtonVariants` resolves through
   `typeof toggleButtonVariants`, which the SFC prop compiler cannot walk. */
/* The state-aware accessible label rides on the ignored heritage rather than the body — a declared
   `'aria-label'` would be camelized to `props.ariaLabel` and never reach the DOM. */
type ToggleButtonAttributes = Omit<ButtonProps, 'variant' | 'tone' | 'children' | 'title' | 'aria-label' | 'color'> & {
  'aria-label'?: StateAware<string>;
};

export interface ToggleButtonProps
  extends /* @vue-ignore */ ToggleButtonAttributes, /* @vue-ignore */ Omit<ToggleButtonVariants, 'variant' | 'tone'> {
  /** The press-state surface style. */
  variant?: ToggleButtonVariant;

  /** The semantic tone palette. */
  tone?: ColorTone;

  /** The controlled pressed state. */
  isPressed?: boolean;

  /** The uncontrolled initial state. Ignored if `isPressed` is set. */
  defaultPressed?: boolean;

  /** The identity inside a `ToggleButtonGroup`, keying its selection. Also the native `value` attr. */
  value?: string;

  /** The tooltip text — a string, or a fn receiving `{ pressed }` for a state-aware label. */
  title?: StateAware<string>;

  /** The per-instance color override — applies to the active `tone`'s theme tokens. See `ColorProp`. */
  color?: ColorProp;

  /** The rich tooltip for icon-only toggles. A string degrades to native `title`; a node is ignored. */
  tooltip?: VNodeChild;

  /** The render element. `div` (role=button) lets interactive children nest. Default `button`. */
  as?: ToggleButtonElement;
}
</script>

<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, ColorTone as ColorToneValue, Key } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import Button from '../button/Button.vue';
import { ButtonVariant } from '../button';
import { ToggleButtonGroupKey } from '../toggleButtonGroup/ToggleButtonGroupContext';
import { ToggleItemRole } from '../toggleButtonGroup/ToggleButtonGroup.variants';
import {
  toggleButtonVariants,
  ToggleButtonElement as ToggleButtonElementValue,
  ToggleButtonVariant as ToggleButtonVariantValue,
} from './ToggleButton.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call; everything else is
   forwarded onto `Button` by hand, which is where the original's `{...buttonProps}` landed. */
defineOptions({ name: 'ToggleButton', inheritAttrs: false });

const props = withDefaults(defineProps<ToggleButtonProps>(), {
  variant: ToggleButtonVariantValue.Ghost,
  tone: ColorToneValue.Primary,
  as: ToggleButtonElementValue.Button,
  /* Explicit `undefined` keeps Vue's boolean casting from collapsing an absent `isPressed` to
     `false`, which would pin the toggle to the controlled branch permanently. */
  isPressed: undefined,
  defaultPressed: undefined,
  /* `VNodeChild` includes `boolean`, so Vue's boolean casting turns an absent node-valued prop
     into `false` rather than `undefined` — which reads as "supplied" at every `!== undefined`
     check. An explicit `undefined` default suppresses the cast. */
  tooltip: undefined,
});

const emit = defineEmits<{
  /** Emits the pressed state whenever it changes. */
  'pressed-change': [pressed: boolean];
}>();

const attrs = useAttrs();

/* Present only inside a `ToggleButtonGroup`; standalone toggles own their state. */
const group = inject(ToggleButtonGroupKey, null);

const { value: pressed, setValue: setPressed } = useControlled<boolean>({
  /* Inside a group the selection lives on the group, which makes the item controlled — the same
     state the original produced by cloning `isPressed` onto each child. An explicit `isPressed`
     prop still wins over the group. */
  controlled: () => props.isPressed ?? group?.isPressed(props.value),
  default: props.defaultPressed ?? false,
  onChange: (pressed) => emit('pressed-change', pressed),
});

/* `aria-label` is read off `attrs`, not `props`: Vue camelizes declared prop keys, so a declared
   `'aria-label'` would arrive as `props.ariaLabel` and never render. It is stripped here and
   re-bound onto `Button` below, so the state-resolved value is the one that lands. */
const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const isDiv = computed(() => props.as === ToggleButtonElementValue.Div);

/* Resolve state-aware string props to plain strings for the underlying Button. */
const resolvedTitle = computed(() => {
  const title = typeof props.title === 'function' ? props.title({ pressed: pressed.value }) : props.title;
  /* `presentation/display` has not ported yet, so a string `tooltip` degrades to the native
     attribute rather than silently vanishing. An explicit `title` always wins. */
  return title ?? (typeof props.tooltip === 'string' ? props.tooltip : undefined);
});

const resolvedAriaLabel = computed(() => {
  const label = attrs['aria-label'] as StateAware<string> | undefined;
  return typeof label === 'function' ? label({ pressed: pressed.value }) : label;
});

const rootClass = computed(() =>
  cn(toggleButtonVariants({ variant: props.variant, tone: props.tone }), attrs.class as ClassValue),
);

/* Tablist wiring is layered by the group, exactly as the original's `cloneElement` did. */
const itemRole = computed(() => (group?.itemRole === ToggleItemRole.Tab ? ('tab' as const) : undefined));
const ariaSelected = computed(() => (itemRole.value === 'tab' ? pressed.value : undefined));

function toggle(): void {
  setPressed(!pressed.value);
  group?.toggle(props.value);
}

/* Chained after the consumer's own click (attribute fallthrough puts theirs first) and skipped
   when they called `preventDefault()` — the original's `onClick?.(e); if (!e.defaultPrevented)`. */
function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  toggle();
}

function handleDivKeyDown(event: KeyboardEvent): void {
  if (event.key === Key.Space || event.key === Key.Enter) {
    event.preventDefault();
    toggle();
  }
}
</script>

<template>
  <!-- Two-state action button (on/off) — sets `aria-pressed` + `data-pressed="true|false"`. Wraps
       Button to inherit the size union, shape, asChild, loading, padding/radius. Press appearance
       lives in `toggleButtonVariants` (variant × tone matrix); ToggleButton's own appearance
       overrides Button's neutral-ghost baseline via class order. -->
  <Button
    :variant="ButtonVariant.Ghost"
    :tone="tone ?? undefined"
    :color="color"
    :as-child="isDiv"
    :value="value"
    :aria-pressed="pressed"
    :aria-label="resolvedAriaLabel"
    :data-pressed="pressed ? 'true' : 'false'"
    :title="resolvedTitle"
    :role="itemRole"
    :aria-selected="ariaSelected"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @click="handleClick"
  >
    <!-- `as="div"` → render through the asChild merge onto a real <div> so consumers may nest
         interactive children (button-in-button is invalid markup). Keyboard parity added here. -->
    <div v-if="isDiv" role="button" :tabindex="0" @keydown="handleDivKeyDown">
      <slot :pressed="pressed" />
    </div>
    <slot v-else :pressed="pressed" />
  </Button>
</template>
