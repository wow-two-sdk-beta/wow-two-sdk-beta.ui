# AudioPlayer

## Purpose
`<audio>` element wrapped in a styled control bar — play/pause, time display, scrubber (or AudioWaveform if `peaks` provided), volume, speed, optional skip-back/forward.

## Anatomy
```
<AudioPlayer src peaks?>
  ├── play/pause
  ├── current / duration time
  ├── scrubber (range) OR <AudioWaveform progress onSeek>
  ├── volume
  └── speed (0.5 / 0.75 / 1 / 1.25 / 1.5 / 2)
</AudioPlayer>
```

## Required behaviors
- Uses native `<audio>` underneath; `controls` attribute disabled in favor of custom UI.
- `peaks` opt-in: when provided, scrubber is replaced by an `AudioWaveform`.
- Keyboard: Space → play/pause; ←/→ scrub 5s; M → mute; Up/Down → volume.
- Loading / error states surfaced via `data-state`.

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `src` | `string` | required | Audio URL |
| `peaks` | `number[]` | — | Optional waveform; replaces scrubber |
| `autoPlay` | `boolean` | `false` | |
| `loop` | `boolean` | `false` | |
| `defaultVolume` | `number` (0..1) | `1` | |
| `defaultPlaybackRate` | `number` | `1` | |
| `onPlay` / `onPause` / `onTimeUpdate` / `onEnded` | callbacks | — | Forwarded |
| `compact` | `boolean` | `false` | Smaller height variant |

## Accessibility
- `<audio>` retains semantics; we add play button with `aria-label="Play"` / "Pause".
- Scrubber: `role="slider"` with `aria-valuetext` reading current time.
- Time displayed in `mm:ss` (or `h:mm:ss` past 1h).

## Dependencies
Foundation: `utils`, `icons`. Same domain: `display/AudioWaveform` (optional).
