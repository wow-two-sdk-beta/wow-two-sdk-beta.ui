<script lang="ts">
import type { ButtonProps } from '../button';

/* The required accessible label rides on the ignored heritage rather than the body — clipboard
   buttons are commonly icon-only, so the name is mandatory, but it must reach the DOM as an
   attribute rather than a (camelized) prop. */
type CopyButtonAttributes = Omit<ButtonProps, 'onClick' | 'children' | 'aria-label' | 'onError'> & {
  'aria-label': string;
};

export interface CopyButtonProps extends /* @vue-ignore */ CopyButtonAttributes {
  /** The text to copy when the button is activated. */
  text: string;

  /** The reset window for the `copied` state in ms. Default 2000. Set 0 to keep `copied` true until the next mount / explicit reset. */
  resetAfter?: number;

  /** The aria-label override while copied=true. Falls back to `aria-label` when omitted (i18n discipline — consumer supplies all user-facing strings). */
  copiedAriaLabel?: string;

  /* Re-declared from `ButtonProps` (identical type) purely so the SFC compiler sees it: a default
     can only be attached to a prop it actually generates, and the heritage is ignored. */

  /** The visual surface style. Default `ghost`. */
  variant?: ButtonVariant;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, watch } from 'vue';
import { Check, Copy } from 'lucide-vue-next';
import { Icon } from '../../../foundation/icons';
import { useClipboard } from '../../../foundation/hooks';
import { OptionalExtensions } from '../../../foundation/utils';
import Button from '../button/Button.vue';
import { ButtonVariant } from '../button';

/* Renders a clipboard-copy button — for code blocks, ID / URL fields, and inline copy affordances. */
/* `inheritAttrs: false` so the raw `aria-label` attr can be swapped for the copied-state one
   below; everything else (`class` included — `Button` folds it into its own `cn()`) is forwarded
   verbatim, which is where the original's trailing `{...props}` spread landed. */
defineOptions({ name: 'CopyButton', inheritAttrs: false });

/* `children` became the default slot; its render-prop form is the slot's `{ copied, error }` props.
   `onError` became the `error` emit. */
const props = withDefaults(defineProps<CopyButtonProps>(), {
  resetAfter: 2000,
  variant: ButtonVariant.Ghost,
});

const emit = defineEmits<{
  /** Emits the caught Error when `navigator.clipboard.writeText` rejects. Fires once per error transition. */
  error: [error: Error];
}>();

const attrs = useAttrs();

/* `aria-label` is read off `attrs`, not `props`: Vue camelizes declared prop keys, so a declared
   `'aria-label'` would arrive as `props.ariaLabel` and never render. */
const OWNED_ATTRS: ReadonlySet<string> = new Set(['aria-label']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const { copied, error, copy } = useClipboard({ resetAfter: () => props.resetAfter });

// Fires once per error transition — the React original's effect keyed on `error`.
watch(error, (next) => {
  if (next) emit('error', next);
});

const effectiveAriaLabel = computed(() => {
  const label = attrs['aria-label'] as string | undefined;
  return copied.value ? (props.copiedAriaLabel ?? label) : label;
});

const fallbackIcon = computed(() => (copied.value ? Check : Copy));

function handleClick(): void {
  void copy(props.text);
}

/* Whether the consumer supplied their own content — the React original's `children ?? <Icon …>`. */
const slots = defineSlots<{
  /** The content — receives `{ copied, error }` for a state-driven swap. Falls back to icon-only Copy/Check when omitted. */
  default?: (props: { copied: boolean; error: Error | null }) => unknown;
}>();
</script>

<template>
  <Button
    :variant="variant"
    :aria-label="effectiveAriaLabel"
    :data-copied="OptionalExtensions.from(copied, 'true')"
    v-bind="passthroughAttrs"
    @click="handleClick"
  >
    <slot v-if="slots.default" :copied="copied" :error="error" />
    <Icon v-else :icon="fallbackIcon" :size="16" />
  </Button>
</template>
