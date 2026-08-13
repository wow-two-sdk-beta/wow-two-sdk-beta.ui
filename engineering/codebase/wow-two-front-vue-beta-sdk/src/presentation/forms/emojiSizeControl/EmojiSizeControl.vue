<script lang="ts">
/* Deep import, not `from '../../actions'`: `ButtonSize` is declared in `Button.vue` and the
   `actions` barrel does not re-export it. The landed `OptionTile.vue` reaches for it the same
   way. Re-exporting it from `actions/button/index.ts` would be the tidier fix, but that file
   belongs to another lane. */
import type { ButtonSize } from '../../actions/button/Button.vue';

/** Defines props for the emoji size control. */
export interface EmojiSizeControlProps {
  /** The emoji rendered inside each tile, so the choice previews the real glyph at that size. */
  readonly glyph: string;

  /** The current size ratio, controlled. The `v-model` binding target. */
  readonly modelValue?: number;

  /** The current size ratio — React's spelling of `modelValue`, which wins when both are set. */
  readonly sizeRatio?: number;

  /**
   * The preset-tile scale, forwarded to each `OptionTile`. Default `sm`.
   *
   * React wrote this as `OptionTileProps['size']`. An indexed access into an
   * imported interface is opaque to the SFC compiler's type resolver — it fails
   * the build while `vue-tsc` stays green — so the named alias the tile itself
   * uses is spelled out instead.
   */
  readonly size?: ButtonSize;

  /** The largest preview glyph, in px — caps each tile's glyph so it never clips the `OptionTile` frame. Default `24`. */
  readonly maxPreviewGlyph?: number;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { OptionTile, OptionTileGroup } from '../../actions';
import { ControlGroup } from '../../layout';
import {
  CenterEmojiSize,
  CenterEmojiSizeDisplays,
  DefaultEmojiSize,
  DefaultMaxPreviewGlyph,
} from './EmojiSizeControl.variants';

/** Renders the emoji size as a small tile set — each tile previews the given glyph at that preset size, no numbers. */
defineOptions({ name: 'EmojiSizeControl' });

const props = withDefaults(defineProps<EmojiSizeControlProps>(), {
  maxPreviewGlyph: DefaultMaxPreviewGlyph,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [ratio: number];
  /** Replaces React's `onChange`, which emitted the next size ratio. */
  'value-change': [ratio: number];
}>();

/* Controlled-only, exactly as React had it — the component owns no state, the host does. */
const currentRatio = computed(() => props.modelValue ?? props.sizeRatio ?? DefaultEmojiSize);

const presets = computed(() =>
  Object.values(CenterEmojiSize).map((preset) => {
    const display = CenterEmojiSizeDisplays[preset];
    return {
      preset,
      label: `Size: ${display.label}`,
      ratio: display.ratio,
      glyphStyle: {
        fontSize: `${Math.min(display.glyph, props.maxPreviewGlyph)}px`,
        lineHeight: 1,
      },
      /* Float compare: the ratios are literals like 0.18/0.25/0.32, so an exact `===` against a
         value that round-tripped through a host would miss. */
      selected: Math.abs(currentRatio.value - display.ratio) < 0.001,
    };
  }),
);

function onSelect(ratio: number): void {
  emit('update:modelValue', ratio);
  emit('value-change', ratio);
}
</script>

<template>
  <ControlGroup label="Size" orientation="vertical" :divided="false">
    <OptionTileGroup label="Emoji size">
      <OptionTile
        v-for="entry in presets"
        :key="entry.preset"
        :size="size"
        :selected="entry.selected"
        :label="entry.label"
        @select="() => onSelect(entry.ratio)"
      >
        <span class="flex h-full w-full items-center justify-center" :style="entry.glyphStyle">
          {{ glyph }}
        </span>
      </OptionTile>
    </OptionTileGroup>
  </ControlGroup>
</template>
