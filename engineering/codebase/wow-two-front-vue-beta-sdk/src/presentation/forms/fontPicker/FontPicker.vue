<script lang="ts">
/** Represents a single selectable font face. */
export interface FontOption {
  name: string;
  family: string;
  sample?: string;
}

export const BUILT_IN_FONTS: ReadonlyArray<FontOption> = [
  { name: 'System Sans', family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { name: 'System Serif', family: 'ui-serif, Cambria, Georgia, "Times New Roman", serif' },
  { name: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Times', family: '"Times New Roman", Times, serif' },
  { name: 'Courier', family: '"Courier New", Courier, monospace' },
  { name: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
  { name: 'Verdana', family: 'Verdana, Geneva, Tahoma, sans-serif' },
  { name: 'Tahoma', family: 'Tahoma, Geneva, Verdana, sans-serif' },
  { name: 'Trebuchet', family: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Garamond', family: 'Garamond, "Times New Roman", serif' },
  { name: 'Comic Sans', family: '"Comic Sans MS", "Comic Sans", cursive' },
  { name: 'Impact', family: 'Impact, "Arial Narrow", sans-serif' },
];

export interface FontPickerProps {
  /** The selected font family, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The selected font family, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial font family when uncontrolled. Defaults to the first entry in `fonts`. */
  defaultValue?: string;

  /** The selectable font set. Defaults to {@link BUILT_IN_FONTS}. */
  fonts?: ReadonlyArray<FontOption>;

  /** The trigger text shown when the value matches no known font. */
  placeholder?: string;

  /** The sample string rendered in each row's own face, unless the option carries its own `sample`. */
  previewText?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The hidden form input name; the hidden input emits the selected family. */
  name?: string;

  /** The control's id — it lands on the trigger button. Auto-filled from `FormControl` context. */
  id?: string;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';

/**
 * Font-family picker with live preview. Each option row renders in its own
 * font face. Wraps `overlays/Popover` for the dropdown.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'FontPicker', inheritAttrs: false });

const props = withDefaults(defineProps<FontPickerProps>(), {
  fonts: () => BUILT_IN_FONTS,
  placeholder: 'Select font…',
  previewText: 'The quick brown fox',
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [family: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [family: string];
}>();

const attrs = useAttrs();

/* Inherits id/disabled/invalid/labelledby/describedby from a surrounding <Field>;
   standalone props win when provided, context fills the gaps (Select parity).
   The `id` lands on the trigger button (the control), not the wrapper div. */
const field = useFormControl();
const finalDisabled = computed(() => props.isDisabled ?? field?.isDisabled);

const controlled = useControlled<string>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? props.fonts[0]?.family ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const family = controlled.value;

/* React kept the popover state internal and exposed no `open` prop; so does this port. */
const open = ref(false);
const query = ref('');

const filtered = computed(() => {
  if (!query.value) return props.fonts;
  const q = query.value.toLowerCase();
  return props.fonts.filter((f) => f.name.toLowerCase().includes(q));
});

const current = computed(() => props.fonts.find((f) => f.family === family.value));

function onOpenChange(next: boolean): void {
  open.value = next;
}

function onQueryInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value;
}

function select(option: FontOption): void {
  controlled.setValue(option.family);
  open.value = false;
}

function optionClass(option: FontOption): string {
  return cn(
    'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
    option.family === family.value && 'bg-primary-soft text-primary-soft-foreground',
  );
}

const triggerId = computed(() => props.id ?? field?.id);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() => cn('inline-block', attrs.class as ClassValue));

const ChevronDownIcon = ChevronDown;
</script>

<template>
  <div :class="wrapperClass" v-bind="passthroughAttrs">
    <Popover :open="open" @open-change="onOpenChange">
      <PopoverTrigger as-child>
        <button
          type="button"
          :id="triggerId"
          :disabled="finalDisabled"
          :aria-invalid="field?.isInvalid || undefined"
          :aria-labelledby="field?.labelledBy"
          :aria-describedby="field?.describedBy"
          aria-haspopup="listbox"
          :aria-expanded="open"
          class="inline-flex h-10 min-w-[14rem] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span :style="{ fontFamily: family }" class="truncate text-foreground">
            {{ current?.name ?? placeholder }}
          </span>
          <Icon :icon="ChevronDownIcon" :size="14" class="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <!-- NOT `is-bare` (which the React original passed): bare strips the whole surface
           recipe — background, border, shadow — leaving a transparent panel with the page
           showing through the font list. The explicit `w-`/`p-` classes already override the
           chrome defaults (`w-72`, `padding: lg`) through `cn`, which is all `is-bare` was
           being used for. -->
      <PopoverContent class="w-[20rem] p-2">
        <input
          type="search"
          autofocus
          :value="query"
          placeholder="Search fonts…"
          class="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @input="onQueryInput"
        />
        <div role="listbox" aria-label="Fonts" class="max-h-72 overflow-y-auto">
          <button
            v-for="f in filtered"
            :key="f.name"
            type="button"
            role="option"
            :aria-selected="f.family === family"
            :class="optionClass(f)"
            @click="select(f)"
          >
            <span class="font-medium">{{ f.name }}</span>
            <span :style="{ fontFamily: f.family }" class="ml-3 truncate text-xs text-muted-foreground">
              {{ f.sample ?? previewText }}
            </span>
          </button>
          <div v-if="filtered.length === 0" class="px-2 py-6 text-center text-xs text-muted-foreground">
            No fonts match.
          </div>
        </div>
      </PopoverContent>
    </Popover>
    <input v-if="name" type="hidden" :name="name" :value="family" />
  </div>
</template>
