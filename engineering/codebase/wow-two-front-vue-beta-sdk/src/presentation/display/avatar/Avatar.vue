<script lang="ts">
import type { CSSProperties } from 'vue';
import type { SizePreset, SizeUnion } from '../../../foundation/utils';
/* The four value-sets are imported as values (not `import type`) so the one binding serves
   as both the prop type below and the runtime enum used in the auto-color guard. */
import {
  AvatarBackground,
  AvatarRing,
  AvatarShape,
  AvatarTone,
  type AvatarVariants,
} from './Avatar.variants';

/* Avatar supports the full canonical preset vocabulary. */
type AvatarSizePreset = SizePreset;

/**
 * The size union — preset (`xs|sm|md|lg|xl|2xl`) · raw number/string (square inline dims) ·
 * object (explicit dims). Named here so `AvatarGroup` can reuse it.
 */
export type AvatarSize = SizeUnion<AvatarSizePreset>;

const AVATAR_SIZE_PRESETS: ReadonlySet<string> = new Set<AvatarSizePreset>([
  'xs', 'sm', 'md', 'lg', 'xl', '2xl',
]);

/* Solid palette for autoColor — 17 distinct hues, dark-mode aware. Light: bg-100/text-800. Dark: bg-900/text-100. No opacity — keeps contrast deterministic across themes. */
const AUTO_COLOR_PALETTE = [
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-100',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
  'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-100',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickAutoColor(name: string): string {
  return AUTO_COLOR_PALETTE[hashName(name) % AUTO_COLOR_PALETTE.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export interface AvatarProps {
  /** The silhouette. */
  shape?: AvatarShape;

  /** The tone palette (`none` cedes color to autoColor). */
  tone?: AvatarTone;

  /** The background fill style. */
  bgStyle?: AvatarBackground;

  /** The focus/emphasis ring tone. */
  ring?: AvatarRing;

  /** The skeleton state — pulses the tile and hides its content. */
  isLoading?: boolean;

  /** The image source; falls back to `name` initials or `fallback` on error. */
  src?: string;

  /** The person/entity name — used to derive initials when no image. */
  name?: string;

  /** The custom fallback (overrides initials). Rich content goes through the `fallback` slot. */
  fallback?: string | number;

  /** The alt text for the underlying `<img>` (defaults to `name`). */
  alt?: string;

  /** The auto-color flag — when true (and no explicit non-neutral `tone` / non-solid `bgStyle`), derives a deterministic soft-color tint from `name` hash → 17-color palette. */
  canAutoColor?: boolean;

  /** The size — preset (`xs|sm|md|lg|xl|2xl`) → variant class · raw number/string → square inline · object → explicit dims. See `AvatarSize`. */
  size?: AvatarSize;
}

/* Compile-time lock: the hand-written `isLoading` prop ≡ the tv variant key (drift = type error).
   `shape` / `tone` / `bgStyle` / `ring` need no lock here — they use the named enums the
   variants file already locks against `avatarVariants`. */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertAvatarLoading: AssertExact<
  NonNullable<AvatarProps['isLoading']>,
  NonNullable<AvatarVariants['isLoading']>
> = true;
void _assertAvatarLoading;
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn, CssExtensions } from '../../../foundation/utils';
import { avatarVariants } from './Avatar.variants';

/**
 * Image avatar with initials fallback. Supports semantic tones, deterministic
 * auto-color from name hash, gradient bg, ring, and loading skeleton.
 * Composable with `<BadgeOverlay>` for status dots / counts / icons.
 */
defineOptions({ name: 'Avatar', inheritAttrs: false });

defineSlots<{
  /** The custom fallback content — wins over the `fallback` prop and the derived initials. */
  fallback?(): unknown;
}>();

/**
 * `isLoading` / `canAutoColor` default to `undefined`, not `false`: Vue casts an absent
 * `Boolean` prop to `false`, and `avatarVariants` expects the tri-state React handed it.
 */
const props = withDefaults(defineProps<AvatarProps>(), {
  name: '',
  isLoading: undefined,
  canAutoColor: undefined,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

const errored = ref(false);

/* A new src deserves a fresh load attempt — reset the error latch. */
watch(
  () => props.src,
  () => {
    errored.value = false;
  },
);

const showImage = computed(() => !!props.src && !errored.value && !props.isLoading);

/* Parse union-typed `size` — preset routes to variant class, raw/object routes to inline dims. */
const parsedSize = computed(() =>
  CssExtensions.parseSizeUnion<AvatarSizePreset>(props.size, AVATAR_SIZE_PRESETS),
);

const boxStyle = computed<CSSProperties | undefined>(() =>
  parsedSize.value.box ? CssExtensions.resolveBoxSize(parsedSize.value.box) : undefined,
);

/* Auto-color fires only when: name set, no explicit non-neutral tone, bgStyle not gradient. Explicit dials win. */
const autoColorClass = computed(() =>
  props.canAutoColor &&
  props.name &&
  props.bgStyle !== AvatarBackground.Gradient &&
  (props.tone === undefined || props.tone === AvatarTone.Neutral)
    ? pickAutoColor(props.name)
    : undefined,
);

/* When auto-color is active, suppress the tone variant so its theme-token classes don't compete in the cascade. */
const effectiveTone = computed(() => (autoColorClass.value ? AvatarTone.None : props.tone));

const initials = computed(() => getInitials(props.name));

const classes = computed(() =>
  cn(
    avatarVariants({
      size: parsedSize.value.preset,
      shape: props.shape,
      tone: effectiveTone.value,
      bgStyle: props.bgStyle,
      ring: props.ring,
      isLoading: props.isLoading,
    }),
    autoColorClass.value,
    attrs.class as string | undefined,
  ),
);

/** The consumer's inline style lands last, so it wins over the parsed box dims. */
const styles = computed(() => [boxStyle.value, attrs.style as CSSProperties | undefined]);

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Own attrs first, `v-bind="rest"` after — a consumer-supplied `data-loading` / `aria-busy`
       still wins, as it did through React's trailing `{...props}` spread. -->
  <span
    ref="el"
    :data-loading="props.isLoading ? 'true' : undefined"
    :aria-busy="props.isLoading ? true : undefined"
    v-bind="rest"
    :class="classes"
    :style="styles"
  >
    <img
      v-if="showImage"
      :src="props.src"
      :alt="props.alt ?? props.name"
      class="h-full w-full object-cover"
      @error="errored = true"
    />
    <slot v-else name="fallback">{{ props.fallback ?? initials }}</slot>
  </span>
</template>
