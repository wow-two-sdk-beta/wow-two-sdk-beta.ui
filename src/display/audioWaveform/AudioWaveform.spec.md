# AudioWaveform

## Purpose
Visualize audio amplitude as a strip of vertical bars. Consumer supplies precomputed `peaks: number[]` (in 0..1). Optional progress overlay + click-to-seek.

## Anatomy
SVG layer of bars. Tone-agnostic (uses `currentColor` for played, `text-muted-foreground/50` for unplayed).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `peaks` | `number[]` | required | Per-bin amplitude in 0..1 |
| `progress` | `number` | `0` | Played fraction (0..1) |
| `width` / `height` | `number` (px) | `320` / `48` | |
| `barWidth` | `number` (px) | `2` | |
| `gap` | `number` (px) | `1` | Between bars |
| `tone` | `'brand' \| 'success' \| 'warning' \| 'danger' \| 'muted' \| 'current'` | `'brand'` | Played-bar color |
| `onSeek` | `(progress: number) => void` | — | Click-to-seek |
| `interactive` | `boolean` | derived from `onSeek` | Forces seek cursor |

## Accessibility
- `role="slider"` with `aria-valuenow / aria-valuemin / aria-valuemax` reflecting progress.
- Keyboard: ←/→ seek by 5%; Home/End → 0%/100%.

## Dependencies
Foundation: `utils`. No cross-domain. No external libs (consumer pre-decodes audio).

## Known limitations (deferred)
- No built-in audio decoding. Pair with `useAudioPeaks()` hook (planned).
- No spectrogram, only RMS/amplitude.
