<script lang="ts">
import type { IconAdapter } from '../../../foundation/icons';
import {
  Bell,
  Bookmark,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Code,
  Coffee,
  Compass,
  Download,
  Edit,
  ExternalLink,
  Eye,
  File,
  Folder,
  Globe,
  Heart,
  Home,
  Image,
  Inbox,
  Info,
  Layers,
  Lightbulb,
  Link2,
  Lock,
  Mail,
  Map,
  MessageCircle,
  Mic,
  Moon,
  Music,
  Paperclip,
  Pencil,
  Phone,
  Pin,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingCart,
  Star,
  Sun,
  Tag,
  Trash,
  Upload,
  User,
  Video,
  Wallet,
  Zap,
} from 'lucide-vue-next';

/* Module-private in React too — the built-in set is not part of the public surface. */
const BUILT_IN_ICONS: Record<string, IconAdapter> = {
  bell: Bell,
  bookmark: Bookmark,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  'chevron-down': ChevronDown,
  clock: Clock,
  cloud: Cloud,
  code: Code,
  coffee: Coffee,
  compass: Compass,
  download: Download,
  edit: Edit,
  'external-link': ExternalLink,
  eye: Eye,
  file: File,
  folder: Folder,
  globe: Globe,
  heart: Heart,
  home: Home,
  image: Image,
  inbox: Inbox,
  info: Info,
  layers: Layers,
  lightbulb: Lightbulb,
  link: Link2,
  lock: Lock,
  mail: Mail,
  map: Map,
  message: MessageCircle,
  mic: Mic,
  moon: Moon,
  music: Music,
  paperclip: Paperclip,
  pencil: Pencil,
  phone: Phone,
  pin: Pin,
  play: Play,
  plus: Plus,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  cart: ShoppingCart,
  star: Star,
  sun: Sun,
  tag: Tag,
  trash: Trash,
  upload: Upload,
  user: User,
  video: Video,
  wallet: Wallet,
  zap: Zap,
};

export interface IconPickerProps {
  /** The selected icon key, controlled — React's spelling, which wins when both are set. */
  value?: string;

  /** The selected icon key, controlled. The `v-model` binding target. */
  modelValue?: string;

  /** The initial icon key when uncontrolled. */
  defaultValue?: string;

  /** The icon set, keyed by the name the picker emits. Defaults to the built-in lucide subset. */
  icons?: Record<string, IconAdapter>;

  /** The number of grid columns. Default `8`. */
  columns?: number;

  /** The glyph pixel size. Default `20`. */
  size?: number;

  /** The pixel size of each icon button. Default `36`. */
  iconButtonSize?: number;

  /** The search-field placeholder. */
  placeholder?: string;

  /** The disabled state. Falls back to the surrounding form control's `isDisabled`. */
  isDisabled?: boolean;

  /** The hidden input name; the hidden input emits the selected icon key. */
  name?: string;

  /** The control's id. Auto-filled from `FormControl` context when omitted. */
  id?: string;
}
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives';
import { inputBaseVariants, InputSize } from '../InputStyles';

/**
 * Searchable icon-picker grid. Built-in 50+ icon subset from `lucide-vue-next`;
 * pass your own `icons` map to override.
 */
/* `inheritAttrs: false` so `class` folds into the panel's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'IconPicker', inheritAttrs: false });

const props = withDefaults(defineProps<IconPickerProps>(), {
  icons: () => BUILT_IN_ICONS,
  columns: 8,
  size: 20,
  iconButtonSize: 36,
  placeholder: 'Search icons…',
  /* Explicit `undefined` defaults: `useControlled` keys on `=== undefined`, and Vue casts an
     absent `boolean` prop to `false` — which would shadow the form control context. */
  value: undefined,
  modelValue: undefined,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half — carries the icon key. */
  'update:modelValue': [name: string];
  /** Replaces React's `onValueChange`. */
  'value-change': [name: string];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* Inline panel (no popover trigger) — the `role="group"` grid is the control:
   it takes the context id (so a Field label's `for` resolves), is named via
   `aria-labelledby`, and described via `aria-describedby`. `aria-invalid` is not
   valid on `group`; invalid state surfaces through the describedby swap to the
   error chrome. Disabled flows to the search input + icon buttons. */
const field = useFormControl();
const finalDisabled = computed(() => props.isDisabled ?? field?.isDisabled);
const labelledBy = computed(() => field?.labelledBy);

const controlled = useControlled<string>({
  controlled: () => props.value ?? props.modelValue,
  default: () => props.defaultValue ?? '',
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const selected = controlled.value;
const query = ref('');

const filtered = computed(() => {
  const entries = Object.entries(props.icons);
  if (!query.value) return entries;
  const q = query.value.toLowerCase();
  return entries.filter(([key]) => key.toLowerCase().includes(q));
});

function onQueryInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value;
}

function buttonClass(key: string): string {
  return cn(
    'inline-flex items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    selected.value === key
      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary'
      : 'border-transparent',
  );
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, ${props.iconButtonSize}px)`,
  maxHeight: '240px',
}));

const buttonStyle = computed(() => ({
  width: `${props.iconButtonSize}px`,
  height: `${props.iconButtonSize}px`,
}));

const gridId = computed(() => props.id ?? field?.id);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const panelClass = computed(() =>
  cn(
    'flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm',
    attrs.class as ClassValue,
  ),
);

const searchClass = cn(inputBaseVariants({ size: InputSize.Sm }));

/** The rendered root `<div>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <div ref="el" :class="panelClass" v-bind="passthroughAttrs">
    <input
      type="search"
      :value="query"
      :placeholder="placeholder"
      :disabled="finalDisabled"
      :class="searchClass"
      @input="onQueryInput"
    />
    <!--
      Flat button collection, no 2D keyboard nav — ARIA grid (grid > row > gridcell)
      would be a lie; group + labeled buttons is honest.
    -->
    <div
      role="group"
      :id="gridId"
      :aria-label="labelledBy ? undefined : 'Icons'"
      :aria-labelledby="labelledBy"
      :aria-describedby="field?.describedBy"
      class="grid gap-1 overflow-y-auto"
      :style="gridStyle"
    >
      <div v-for="[key, iconComp] in filtered" :key="key">
        <button
          type="button"
          :aria-pressed="selected === key"
          :aria-label="key"
          :disabled="finalDisabled"
          :style="buttonStyle"
          :class="buttonClass(key)"
          @click="controlled.setValue(key)"
        >
          <Icon :icon="iconComp" :size="size" />
        </button>
      </div>
      <div
        v-if="filtered.length === 0"
        class="col-span-full px-2 py-6 text-center text-xs text-muted-foreground"
      >
        No icons match.
      </div>
    </div>
    <input v-if="name" type="hidden" :name="name" :value="selected" />
  </div>
</template>
