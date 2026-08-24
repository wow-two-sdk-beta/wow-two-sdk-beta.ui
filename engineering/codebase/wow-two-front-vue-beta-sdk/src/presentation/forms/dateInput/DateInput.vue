<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface DateInputProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The value, controlled. The `v-model` binding target. `null` is the cleared state. */
  modelValue?: Temporal.PlainDate | null;

  /** The value, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: Temporal.PlainDate | null;

  /** The initial value when uncontrolled. */
  defaultValue?: Temporal.PlainDate | null;

  /** The earliest selectable date. */
  min?: Temporal.PlainDate | null;

  /** The latest selectable date. */
  max?: Temporal.PlainDate | null;

  /**
   * Renders a bare `<input type="date">` and drops the popover.
   *
   * Opt-in only. The browser owns that control's picker panel — it cannot be themed, so it
   * lands a system-chrome popup in the middle of a design-system form. Reach for it when the
   * platform picker is the point (a mobile-first form wanting the OS wheels, for instance).
   */
  native?: boolean;

  /** The empty-state text. Ignored when `native` — that control renders its own mask. */
  placeholder?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  disabled?: boolean;

  /** The required state. Falls back to the surrounding form control's `isRequired`. */
  required?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';
import { formatISODate, parseISODate, today } from '../DateExtensions';
import Calendar from '../calendar/Calendar.vue';

/**
 * Atomic date input — a typed `YYYY-MM-DD` field with a design-system `Calendar` popover on
 * the trailing button. Accepts and emits `Temporal.PlainDate`.
 *
 * The popover is ours, not the browser's: an `<input type="date">` opens an unstylable system
 * panel, which is what `native` is for. `DatePicker` is the trigger-shaped peer — reach for
 * this one when the form wants a text field the user can type into.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'DateInput', inheritAttrs: false });

const props = withDefaults(defineProps<DateInputProps>(), {
  native: false,
  placeholder: 'YYYY-MM-DD',
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false` — which would
     shadow the context with a hard "not disabled / not required". */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: Temporal.PlainDate | null];
  /** Replaces React's `onValueChange`. Native `input` / `change` stay fallthrough listeners. */
  'value-change': [value: Temporal.PlainDate | null];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<Temporal.PlainDate | null>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const committed = controlled.value;

const open = ref(false);

/** The ISO form the native control, the typed field and form submission all speak. */
const displayValue = computed(() => formatISODate(committed.value));

/** The in-flight text — free-form while typing, reconciled with `committed` on commit. */
const draft = ref<string>(displayValue.value);

/* Syncs the draft when the committed value changes from the outside (or from the popover). */
watch(displayValue, (next) => {
  draft.value = next;
});

/** Commits the draft; an unparseable draft reverts to the committed value (ColorInput parity). */
function commit(): void {
  if (!draft.value.trim()) {
    controlled.setValue(null);
    draft.value = '';
    return;
  }
  const next = parseISODate(draft.value.trim());
  if (next) {
    controlled.setValue(next);
    draft.value = formatISODate(next);
  } else {
    draft.value = displayValue.value;
  }
}

function onDraftInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value;
}

/* Runs after any caller-supplied `@blur` — declared after `v-bind`, so Vue chains theirs first. */
function onBlur(): void {
  commit();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
}

/** The `native` path keeps the original ISO-string round trip. */
function onNativeInput(event: Event): void {
  controlled.setValue(parseISODate((event.target as HTMLInputElement).value));
}

/* A day is the whole value here, so the pick closes the panel — `DatePicker` parity, and
   unlike `DateTimeInput`, where the time half still has to be chosen. */
function onCalendarChange(next: Temporal.PlainDate | null): void {
  controlled.setValue(next);
  open.value = false;
}

const calendarMonth = computed(() => committed.value ?? today());
const minValue = computed(() => formatISODate(props.min));
const maxValue = computed(() => formatISODate(props.max));

const finalState = computed(() => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default));

const inputId = computed(() => props.id ?? ctx?.id);
const isDisabled = computed(() => props.disabled ?? ctx?.isDisabled);
const isRequired = computed(() => props.required ?? ctx?.isRequired);
const isInvalid = computed(() => ctx?.isInvalid || undefined);
const describedBy = computed(() => ctx?.describedBy);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

/* The caller's `class` sizes the field and the input keeps `w-full` from the variants —
   the adorned-input idiom already used by `PasswordInput` / `SearchInput`. */
const wrapperClass = computed(() => cn('relative', attrs.class as ClassValue));

const inputClass = computed(() =>
  cn(
    inputBaseVariants({
      size: props.size,
      state: finalState.value,
      border: props.border,
      ring: props.ring,
    }),
    !props.native && 'pr-10',
  ),
);

const root = useTemplateRef<HTMLInputElement>('root');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div :class="wrapperClass">
    <!-- The unstylable-system-panel path, kept for callers that want the platform picker. -->
    <input
      v-if="native"
      ref="root"
      type="date"
      :id="inputId"
      :value="displayValue"
      :min="minValue"
      :max="maxValue"
      :disabled="isDisabled"
      :required="isRequired"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      :class="inputClass"
      v-bind="passthroughAttrs"
      @input="onNativeInput"
    />

    <Popover v-else v-model:open="open" placement="bottom-start" :offset="6">
      <input
        ref="root"
        type="text"
        autocomplete="off"
        :spellcheck="false"
        :id="inputId"
        :value="draft"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :required="isRequired"
        :aria-invalid="isInvalid"
        :aria-describedby="describedBy"
        :class="inputClass"
        v-bind="passthroughAttrs"
        @input="onDraftInput"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <PopoverTrigger
        aria-label="Choose date"
        :disabled="isDisabled"
        class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <CalendarIcon class="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent is-bare>
        <Calendar
          :value="committed"
          :default-month="calendarMonth"
          :min="min"
          :max="max"
          @value-change="onCalendarChange"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
