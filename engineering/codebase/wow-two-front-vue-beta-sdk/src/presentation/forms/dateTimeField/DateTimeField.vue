<script lang="ts">
import type { Temporal } from 'temporal-polyfill';
import type { InputSize, InputState, InputBorder, InputRing } from '../InputStyles';

export interface DateTimeFieldProps {
  /** The control size. */
  size?: InputSize;
  /** The validity surface. */
  state?: InputState;
  /** The border weight. */
  border?: InputBorder;
  /** The focus-ring weight. */
  ring?: InputRing;

  /** The value, controlled. The `v-model` binding target. `null` is the cleared state. */
  modelValue?: Temporal.PlainDateTime | null;

  /** The value, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: Temporal.PlainDateTime | null;

  /** The initial value when uncontrolled. */
  defaultValue?: Temporal.PlainDateTime | null;

  /** The earliest selectable wall-clock instant. */
  min?: Temporal.PlainDateTime | null;

  /** The latest selectable wall-clock instant. */
  max?: Temporal.PlainDateTime | null;

  /**
   * Renders a bare `<input type="datetime-local">` and drops the popover.
   *
   * Opt-in only. The browser owns that control's picker panel — it cannot be themed, so it
   * lands a system-chrome popup in the middle of a design-system form. Reach for it when the
   * platform picker is the point (a mobile-first form wanting the OS wheels, for instance).
   */
  native?: boolean;

  /** The minute interval offered in the popover. Default 5. Ignored when `native`. */
  minuteStep?: number;

  /** The empty-state text. Ignored when `native` — that control renders its own mask. */
  placeholder?: string;

  /** The hidden input name; when set, a hidden input ships the ISO value with form submission. */
  name?: string;

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
import { CalendarClock } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { inputBaseVariants, InputState as InputStateValue } from '../InputStyles';
import { formatISODateTime, parseISODate, parseISODateTime, today } from '../DateExtensions';
import Calendar from '../calendar/Calendar.vue';
import TimeColumns from '../TimeColumns.vue';

/**
 * Atomic datetime input — a typed `YYYY-MM-DD HH:MM` field with a design-system popover
 * (`Calendar` + hour/minute columns) on the trailing button. Accepts and emits
 * `Temporal.PlainDateTime` (calendar wall-clock, no zone).
 *
 * The popover is ours, not the browser's: an `<input type="datetime-local">` opens an
 * unstylable system panel, which is what `native` is for.
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'DateTimeField', inheritAttrs: false });

const props = withDefaults(defineProps<DateTimeFieldProps>(), {
  native: false,
  minuteStep: 5,
  placeholder: 'YYYY-MM-DD HH:MM',
  /* Explicit `undefined` defaults are load-bearing: each flag falls back to the form
     control context, and Vue casts an absent `boolean` prop to `false` — which would
     shadow the context with a hard "not disabled / not required". */
  disabled: undefined,
  required: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: Temporal.PlainDateTime | null];
  /** Replaces React's `onValueChange`. Native `input` / `change` stay fallthrough listeners. */
  'value-change': [value: Temporal.PlainDateTime | null];
}>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

const controlled = useControlled<Temporal.PlainDateTime | null>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const committed = controlled.value;

const open = ref(false);

/** The ISO form the native control and form submission both speak. */
const isoValue = computed(() => formatISODateTime(committed.value));

/** The typed form — the same ISO with the `T` softened to a space. */
const displayText = computed(() => isoValue.value.replace('T', ' '));

/** The in-flight text — free-form while typing, reconciled with `committed` on commit. */
const draft = ref<string>(displayText.value);

/* Syncs the draft when the committed value changes from the outside (or from the popover). */
watch(displayText, (next) => {
  draft.value = next;
});

/** Accepts `YYYY-MM-DD HH:MM`, its `T` spelling, and a bare `YYYY-MM-DD` (→ midnight). */
function parseDateTimeText(text: string): Temporal.PlainDateTime | null {
  const normalised = text.trim().replace(/\s+/, 'T');
  const full = parseISODateTime(normalised);
  if (full) return full;
  const dateOnly = parseISODate(normalised);
  return dateOnly ? dateOnly.toPlainDateTime() : null;
}

/** Commits the draft; an unparseable draft reverts to the committed value (ColorField parity). */
function commit(): void {
  if (!draft.value.trim()) {
    controlled.setValue(null);
    draft.value = '';
    return;
  }
  const next = parseDateTimeText(draft.value);
  if (next) {
    controlled.setValue(next);
    draft.value = formatISODateTime(next).replace('T', ' ');
  } else {
    draft.value = displayText.value;
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
  controlled.setValue(parseISODateTime((event.target as HTMLInputElement).value));
}

/* A date pick keeps the time that was already set; a time pick keeps the date. Neither
   closes the popover — the other half still has to be chosen. */
function onCalendarChange(date: Temporal.PlainDate | null): void {
  if (!date) {
    controlled.setValue(null);
    return;
  }
  controlled.setValue(date.toPlainDateTime(committed.value?.toPlainTime()));
}

function onColumnsChange(time: Temporal.PlainTime): void {
  const date = committed.value?.toPlainDate() ?? today();
  controlled.setValue(date.toPlainDateTime(time));
}

const calendarValue = computed(() => committed.value?.toPlainDate() ?? null);
const calendarMonth = computed(() => calendarValue.value ?? today());
const timeValue = computed(() => committed.value?.toPlainTime() ?? null);

/* The day bounds the calendar can express — the hour half of `min`/`max` stays the typed
   field's business, exactly as it was under the native control. */
const minDate = computed(() => props.min?.toPlainDate() ?? null);
const maxDate = computed(() => props.max?.toPlainDate() ?? null);
const minValue = computed(() => formatISODateTime(props.min));
const maxValue = computed(() => formatISODateTime(props.max));

const finalState = computed(
  () => props.state ?? (ctx?.isInvalid ? InputStateValue.Invalid : InputStateValue.Default),
);

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
      type="datetime-local"
      :id="inputId"
      :value="isoValue"
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
        aria-label="Choose date and time"
        :disabled="isDisabled"
        class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <CalendarClock class="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent is-bare>
        <div class="flex items-start gap-2">
          <Calendar
            :value="calendarValue"
            :default-month="calendarMonth"
            :min="minDate"
            :max="maxDate"
            @value-change="onCalendarChange"
          />
          <TimeColumns
            :value="timeValue"
            :minute-step="minuteStep"
            :on-time-change="onColumnsChange"
          />
        </div>
      </PopoverContent>
    </Popover>

    <input v-if="name" type="hidden" :name="name" :value="isoValue" />
  </div>
</template>
