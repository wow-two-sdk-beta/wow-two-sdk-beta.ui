<script lang="ts">
export interface AudioPlayerProps {
  /** The audio source URL. */
  src: string;
  /** The pre-computed per-bin amplitudes — swaps the range scrubber for an `AudioWaveform`. */
  peaks?: ReadonlyArray<number>;
  /** The autoplay state, forwarded to the native `<audio>`. */
  autoPlay?: boolean;
  /** The loop state, forwarded to the native `<audio>`. */
  loop?: boolean;
  /** The initial volume in 0..1. Default `1`. */
  defaultVolume?: number;
  /** The initial playback rate. Default `1`. */
  defaultPlaybackRate?: number;
  /** The dense layout. Default `false`. */
  isCompact?: boolean;
}

const SPEEDS: ReadonlyArray<number> = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { Pause, Play, Volume2, VolumeX } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { AudioWaveform } from '../audioWaveform';

/**
 * Custom-controls audio player. Native `<audio>` underneath; play/pause,
 * scrubber (or `AudioWaveform` if `peaks` provided), volume, speed.
 */
defineOptions({ name: 'AudioPlayer', inheritAttrs: false });

const props = withDefaults(defineProps<AudioPlayerProps>(), {
  peaks: undefined,
  autoPlay: undefined,
  loop: undefined,
  defaultVolume: 1,
  defaultPlaybackRate: 1,
  isCompact: undefined,
});

const emit = defineEmits<{
  /** Fires when playback starts. */
  play: [];
  /** Fires when playback pauses. */
  pause: [];
  /** Fires on every `timeupdate` with the current time and the total duration. */
  'time-update': [time: number, duration: number];
  /** Fires when playback reaches the end. */
  ended: [];
}>();

const attrs = useAttrs();
/** The native `<audio>` — React exposed it through `useImperativeHandle`. */
const el = useTemplateRef<HTMLAudioElement>('el');

const playing = ref(!!props.autoPlay);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(props.defaultVolume);
const muted = ref(false);
const speed = ref(props.defaultPlaybackRate);

/** Push the three imperative settings onto the element — React's `useEffect`. */
function applyAudioSettings(): void {
  const audio = el.value;
  if (!audio) return;
  audio.volume = volume.value;
  audio.muted = muted.value;
  audio.playbackRate = speed.value;
}

onMounted(applyAudioSettings);
watch([volume, muted, speed], applyAudioSettings, { flush: 'post' });

function togglePlay(): void {
  const audio = el.value;
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {
      /* autoplay rejection */
    });
  } else {
    audio.pause();
  }
}

function seekTo(seconds: number): void {
  const audio = el.value;
  if (!audio || !Number.isFinite(seconds)) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seconds));
}

function seekProgress(fraction: number): void {
  if (duration.value > 0) seekTo(fraction * duration.value);
}

function onKeydown(event: KeyboardEvent): void {
  // Only handle shortcuts aimed at the container itself — never hijack
  // keys from interactive children (seek slider, speed select, buttons).
  if (event.target !== event.currentTarget) return;
  switch (event.key) {
    case ' ':
    case 'Spacebar':
      event.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      event.preventDefault();
      seekTo(currentTime.value + 5);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      seekTo(currentTime.value - 5);
      break;
    case 'ArrowUp':
      event.preventDefault();
      volume.value = Math.min(1, volume.value + 0.1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      volume.value = Math.max(0, volume.value - 0.1);
      break;
    case 'm':
    case 'M':
      event.preventDefault();
      muted.value = !muted.value;
      break;
  }
}

function onNativePlay(): void {
  playing.value = true;
  emit('play');
}

function onNativePause(): void {
  playing.value = false;
  emit('pause');
}

function onNativeTimeUpdate(): void {
  const audio = el.value;
  if (!audio) return;
  currentTime.value = audio.currentTime;
  emit('time-update', audio.currentTime, audio.duration);
}

function onNativeLoadedMetadata(): void {
  const audio = el.value;
  if (audio) duration.value = audio.duration || 0;
}

function onNativeEnded(): void {
  playing.value = false;
  emit('ended');
}

function onRangeInput(event: Event): void {
  seekTo(Number((event.target as HTMLInputElement).value));
}

const progress = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0));

const classes = computed(() =>
  cn(
    'flex items-center gap-3 rounded-md border border-border bg-card p-2 text-card-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    props.isCompact && 'gap-2 p-1.5',
    attrs.class as string | undefined,
  ),
);

/**
 * Everything but `class` — and, exactly as in the React original, it lands on
 * the inner `<audio>`, not on the wrapper. `class` is re-applied through `cn`.
 */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

const TIME_STYLE = { minWidth: '3.5rem' } as const;
const DURATION_STYLE = { minWidth: '3.5rem', textAlign: 'right' } as const;

defineExpose({ el });
</script>

<template>
  <div
    role="region"
    aria-label="Audio player"
    :tabindex="0"
    :data-playing="playing || undefined"
    :class="classes"
    @keydown="onKeydown"
  >
    <audio
      ref="el"
      :src="src"
      :autoplay="autoPlay"
      :loop="loop"
      v-bind="rest"
      @play="onNativePlay"
      @pause="onNativePause"
      @timeupdate="onNativeTimeUpdate"
      @loadedmetadata="onNativeLoadedMetadata"
      @ended="onNativeEnded"
    />
    <button
      type="button"
      :aria-label="playing ? 'Pause' : 'Play'"
      :class="
        cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isCompact ? 'h-7 w-7' : 'h-9 w-9',
        )
      "
      @click="togglePlay"
    >
      <Icon :icon="playing ? Pause : Play" :size="isCompact ? 12 : 14" />
    </button>
    <span class="shrink-0 text-xs tabular-nums text-muted-foreground" :style="TIME_STYLE">{{
      formatTime(currentTime)
    }}</span>
    <div class="flex-1">
      <AudioWaveform
        v-if="peaks"
        :peaks="peaks"
        :progress="progress"
        :on-seek="seekProgress"
        :width="isCompact ? 200 : 320"
        :height="isCompact ? 32 : 40"
      />
      <input
        v-else
        type="range"
        role="slider"
        aria-label="Seek"
        :aria-valuetext="formatTime(currentTime)"
        :min="0"
        :max="duration || 0"
        step="any"
        :value="currentTime"
        class="w-full accent-primary"
        @input="onRangeInput"
      />
    </div>
    <span class="shrink-0 text-xs tabular-nums text-muted-foreground" :style="DURATION_STYLE">{{
      formatTime(duration)
    }}</span>
    <button
      type="button"
      :aria-label="muted ? 'Unmute' : 'Mute'"
      class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      @click="muted = !muted"
    >
      <Icon :icon="muted || volume === 0 ? VolumeX : Volume2" :size="14" />
    </button>
    <select
      v-model="speed"
      aria-label="Playback speed"
      class="h-7 rounded-sm border border-input bg-background px-1 text-xs"
    >
      <option v-for="rate in SPEEDS" :key="rate" :value="rate">{{ rate }}×</option>
    </select>
  </div>
</template>
