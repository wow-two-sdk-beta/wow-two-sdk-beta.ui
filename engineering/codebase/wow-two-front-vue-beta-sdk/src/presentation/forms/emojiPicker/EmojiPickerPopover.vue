<script lang="ts">
import type { Placement } from '@floating-ui/vue';
import type { EmojiCatalogEntry } from '../../../domain/emoji';
import type { StorageBroker } from '../../../foundation/storage';
import type { CategoryNavVariant, EmojiPickerSizeInput, EmojiTileShape } from './EmojiPicker.variants';

/**
 * Defines props for the popover-hosted emoji picker.
 *
 * React wrote this as `extends Omit<EmojiPickerProps, 'value' | 'onChange'>`. The
 * forwarded picker props are spelled out instead: the SFC compiler has to generate
 * them as real props (they are forwarded by hand, not fallthrough attrs), and an
 * `Omit<…>` heritage over an imported interface is exactly what its type resolver
 * cannot follow.
 */
export interface EmojiPickerPopoverProps {
  /** The current emoji catalog entry, or `null` for none. The `v-model` binding target. */
  readonly modelValue?: EmojiCatalogEntry | null;

  /** The current emoji catalog entry — React's spelling of `modelValue`, which wins when both are set. */
  readonly value?: EmojiCatalogEntry | null;

  /** The persistence contract backing the "recently used" list. */
  readonly storage: StorageBroker;

  /** The category-navigation affordance. Default `strip`. */
  readonly categoryNavVariant?: CategoryNavVariant;

  /** The element scale — one value for every element, or a per-element `{ search, nav, tile }`. Default `md`. */
  readonly size?: EmojiPickerSizeInput;

  /** The emoji-tile frame — rounded chip or circle. Default `rounded`. */
  readonly tileShape?: EmojiTileShape;

  /** The scrollable tile viewport's height, in tile rows. Default `6`. */
  readonly rowsCount?: number;

  /** The heading rendered above the picker. Default `Emoji`. */
  readonly label?: string;

  /** When `true` and no emoji has been used yet, opens on the first real category. Default `false`. */
  readonly showFirstCategoryWhenRecentsEmpty?: boolean;

  /** The scrollbar thumb color for the tile viewport — any CSS color. */
  readonly scrollThumbColor?: string;

  /** The popover placement relative to the trigger. Default `bottom`. */
  readonly placement?: Placement;

  /** The open state, controlled. The `v-model:open` binding target. */
  readonly open?: boolean;

  /** The open state, controlled — the house boolean spelling of `open`; `open` wins when both are set. */
  readonly isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  readonly defaultOpen?: boolean;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { ColorTone, SizePreset } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { FormControlProvider, useFormControl } from '../../../foundation/primitives';
import { Button, ButtonShape, ButtonVariant } from '../../actions';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import EmojiPicker from './EmojiPicker.vue';

/**
 * Popover-hosted `EmojiPicker` — a chat/toolbar-friendly variant. A trigger opens a `Popover` holding the
 * full `EmojiPicker`; picking an entry emits it via `@value-change` / `v-model` (consumers read
 * `entry.glyph`) and closes the popover. Size is out of scope here — compose `EmojiSizeControl`
 * separately when a host needs a per-emoji scale.
 */
defineOptions({ name: 'EmojiPickerPopover' });

/** React's `trigger` / `children` props are one `trigger` slot — a custom trigger replacing the default emoji-icon `Button`. */
defineSlots<{ trigger?(): unknown }>();

const props = withDefaults(defineProps<EmojiPickerPopoverProps>(), {
  placement: 'bottom',
  defaultOpen: false,
  /* `useControlled` keys on `=== undefined`, and Vue casts an absent `boolean` prop to `false`:
     without these the popover would read as "controlled, and closed" and never open. */
  open: undefined,
  isOpen: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [entry: EmojiCatalogEntry | null];
  /** Replaces React's `onChange`. Carries the picked entry, or `null` on clear. */
  'value-change': [entry: EmojiCatalogEntry | null];
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

const openCtl = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
    emit('open-change', next);
  },
});

const isOpenNow = computed(() => openCtl.value.value);
const currentValue = computed(() => (props.value !== undefined ? props.value : (props.modelValue ?? null)));

/* Inherits id/invalid/labelledby/describedby from a surrounding <Field> for the DEFAULT trigger
   (`Button` already inherits `isDisabled` from the context itself). A custom trigger slot owns
   its own form-control wiring. `aria-labelledby` wins the accessible-name computation, so
   "Choose emoji" stays the fallback when there is no Field label. */
const field = useFormControl();

const fieldId = computed(() => field?.id);
const fieldLabelledBy = computed(() => field?.labelledBy);
const fieldDescribedBy = computed(() => field?.describedBy);
const fieldInvalid = computed(() => field?.isInvalid || undefined);

const triggerGlyph = computed(() => currentValue.value?.glyph ?? '🙂');

function onPick(entry: EmojiCatalogEntry | null): void {
  emit('update:modelValue', entry);
  emit('value-change', entry);
  if (entry !== null) openCtl.setValue(false);
}
</script>

<template>
  <Popover :open="isOpenNow" :placement="placement" @open-change="openCtl.setValue($event)">
    <PopoverTrigger as-child>
      <slot name="trigger">
        <Button
          :variant="ButtonVariant.Ghost"
          :tone="ColorTone.Neutral"
          :size="SizePreset.Sm"
          :shape="ButtonShape.Square"
          :id="fieldId"
          aria-label="Choose emoji"
          :aria-labelledby="fieldLabelledBy"
          :aria-describedby="fieldDescribedBy"
          :aria-invalid="fieldInvalid"
        >
          {{ triggerGlyph }}
        </Button>
      </slot>
    </PopoverTrigger>
    <PopoverContent class="w-80" padding="sm">
      <!--
        The panel's SearchInput is a sub-control of the picker, not the field's control — a bare
        FormControlProvider keeps it from adopting the surrounding Field's id (which now names
        the trigger; adoption would duplicate it) or its chrome.
      -->
      <FormControlProvider>
        <EmojiPicker
          :model-value="currentValue"
          :storage="storage"
          :category-nav-variant="categoryNavVariant"
          :size="size"
          :tile-shape="tileShape"
          :rows-count="rowsCount"
          :label="label"
          :show-first-category-when-recents-empty="showFirstCategoryWhenRecentsEmpty"
          :scroll-thumb-color="scrollThumbColor"
          @value-change="onPick"
        />
      </FormControlProvider>
    </PopoverContent>
  </Popover>
</template>
