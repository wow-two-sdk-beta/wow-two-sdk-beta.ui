<script lang="ts">
/* `Orientation` is imported here (not in `<script setup>`) so the one binding
   serves as both the type below and the runtime value used in `withDefaults`. */
import { Orientation } from '../../../foundation/utils';

/** Defines props for a labelled group of controls. */
export interface ControlGroupProps {
  /**
   * The group's label — muted; sits beside the control(s) when horizontal, above them when vertical.
   * React typed this `ReactNode`; a Vue prop renders text, so richer content goes through the
   * same-named `label` slot, which overrides this value.
   */
  label: string | number;

  /** The label-to-control arrangement — `horizontal` (label beside) or `vertical` (label above). Default `horizontal`. */
  orientation?: Orientation;

  /** The hairline between this and the next group (settings-list look). Default `true`. */
  divided?: boolean;

  /** The fixed label width for the horizontal layout — pass to align labels across a stack of rows, e.g. `"6rem"`. Omit for content-driven width. */
  labelWidth?: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type CSSProperties } from 'vue';
import { cn } from '../../../foundation/utils';
import { controlGroupVariants } from './ControlGroup.variants';

/**
 * Renders a labelled group of controls — a muted label bound to its control(s),
 * laid out horizontally (label beside) or vertically (label above). Stacked
 * groups auto-divide via a hairline unless `:divided="false"`.
 */
defineOptions({ name: 'ControlGroup', inheritAttrs: false });

defineSlots<{
  /** Rich-content override for the `label` prop. */
  label?(): unknown;
  /** The control(s) bound to the label — React's required `children`. */
  default(): unknown;
}>();

const props = withDefaults(defineProps<ControlGroupProps>(), {
  orientation: Orientation.Horizontal,
  divided: true,
  labelWidth: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const styles = computed(() => controlGroupVariants({ orientation: props.orientation, divided: props.divided }));

const rootClasses = computed(() => cn(styles.value.root(), attrs.class as string | undefined));

const labelStyle = computed<CSSProperties | undefined>(() =>
  props.labelWidth ? { flex: `0 0 ${props.labelWidth}` } : undefined,
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="rootClasses">
    <span :class="styles.label()" :style="labelStyle">
      <slot name="label">{{ props.label }}</slot>
    </span>
    <div :class="styles.content()"><slot /></div>
  </div>
</template>
