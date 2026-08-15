<script lang="ts">
import { AriaAttribute } from '../../../foundation/utils';
import type { ButtonProps } from '../button';

/** @internal The attributes this component renders itself rather than forwarding. */
const OwnedAttributes = [AriaAttribute.Label] as const;

/** @internal An attribute name from {@link OwnedAttributes}. */
type OwnedAttribute = (typeof OwnedAttributes)[number];

/**
 * @internal A `ButtonProps` member this component replaces with its own emit. Written through `Pick`
 * rather than as a bare key union: `Omit` accepts a key the type does not have, `Pick` does not.
 */
type ReplacedButtonProp = keyof Pick<ButtonProps, 'onError'>;

/** Defines the forwarded `ButtonProps`, with the owned attributes re-added as required. */
type CopyButtonAttributes = Omit<ButtonProps, ReplacedButtonProp | OwnedAttribute> & Record<OwnedAttribute, string>;

/** Defines props for the clipboard-copy button. */
export interface CopyButtonProps extends /* @vue-ignore */ CopyButtonAttributes {
  /** The text to copy when the button is activated. */
  text: string;

  /** The reset window for the `copied` state in ms. Default 2000. Set 0 to hold `copied` until the next mount. */
  resetAfter?: number;

  /** The accessible name to announce while `copied` is true. Falls back to `aria-label` when omitted. */
  copiedAriaLabel?: string;

  /* Re-declared from the ignored heritage so the SFC compiler generates a prop to hang a default on. */

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

/** Renders a clipboard-copy button — for code blocks, ID / URL fields, and inline copy affordances. */
defineOptions({ name: 'CopyButton', inheritAttrs: false });

const props = withDefaults(defineProps<CopyButtonProps>(), {
  resetAfter: 2000,
  variant: ButtonVariant.Ghost,
});

const emit = defineEmits<{
  /** Fires when `navigator.clipboard.writeText` rejects, once per error transition. */
  error: [error: Error];
}>();

const slots = defineSlots<{
  /** The content — receives `{ copied, error }` for a state-driven swap. Icon-only Copy/Check when omitted. */
  default?: (props: { copied: boolean; error: Error | null }) => unknown;
}>();

/** @internal {@link OwnedAttributes} as a lookup, for filtering the fallthrough set. */
const OwnedAttributeLookup: ReadonlySet<string> = new Set(OwnedAttributes);

/**
 * @internal The `data-copied` value emitted while the copy has succeeded.
 *
 * Pinned to `'true'` by Standard rule 8, not the `''` the house `dataAttr` helper emits — the
 * attribute is specified as a value, and analytics scrapers read it.
 */
const CopiedAttributeValue = 'true';

const attrs = useAttrs();

const { copied, error, copy } = useClipboard({ resetAfter: () => props.resetAfter });

/** The fallthrough attributes minus the ones this component renders itself. */
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OwnedAttributeLookup.has(key))),
);

/** The accessible name for the current state — `copiedAriaLabel` while copied, `aria-label` otherwise. */
const effectiveAriaLabel = computed(() => {
  const label = attrs[AriaAttribute.Label] as string | undefined;
  return copied.value ? (props.copiedAriaLabel ?? label) : label;
});

/** The state icon shown when the consumer supplies no content. */
const fallbackIcon = computed(() => (copied.value ? Check : Copy));

/** Emits `error` on each transition into a failed copy. */
watch(error, (next) => {
  if (next) emit('error', next);
});

/** Copies the current text, discarding the settled promise. */
function handleClick(): void {
  void copy(props.text);
}
</script>

<template>
  <Button
    :variant="variant"
    :aria-label="effectiveAriaLabel"
    :data-copied="OptionalExtensions.from(copied, CopiedAttributeValue)"
    v-bind="passthroughAttrs"
    @click="handleClick"
  >
    <slot v-if="slots.default" :copied="copied" :error="error" />
    <Icon v-else :icon="fallbackIcon" :size="16" />
  </Button>
</template>
