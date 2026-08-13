# VideoPlayer

## Purpose
`<video>` wrapped with custom controls — play/pause, time, scrubber, volume, captions toggle, speed, picture-in-picture, fullscreen.

## Anatomy
```
<VideoPlayer src poster? tracks? aspectRatio?>
  ├── <video>
  └── overlay controls
       ├── play/pause
       ├── current/duration time
       ├── scrubber
       ├── volume
       ├── speed (0.5..2)
       ├── captions toggle
       ├── PiP
       └── fullscreen
</VideoPlayer>
```

## Required behaviors
- Native `<video>` element (with `controls={false}`); custom UI overlays.
- Click on video toggles play/pause.
- Move-mouse → reveal controls; idle → hide after 3s during playback.
- Keyboard: Space → play/pause; ←/→ scrub 5s; ↑/↓ volume; M → mute; F → fullscreen; C → toggle captions.
- Captions tracks: `<track>` children supported (consumer passes `tracks` prop).

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `src` | `string` | required | Video URL |
| `poster` | `string` | — | Preview image |
| `tracks` | `Array<{ src; srcLang; label; kind?; default? }>` | — | Captions |
| `aspectRatio` | `string \| number` | `'16/9'` | CSS `aspect-ratio` |
| `autoPlay` / `loop` / `muted` | `boolean` | various | |
| `defaultVolume` | `number` | `1` | |
| `defaultPlaybackRate` | `number` | `1` | |

## Accessibility
- Native `<video>` semantics retained.
- Each control button has `aria-label`.
- Scrubber: `role="slider"` + `aria-valuetext`.

## Dependencies
Foundation: `utils`, `icons`. No cross-domain. No external libs.
