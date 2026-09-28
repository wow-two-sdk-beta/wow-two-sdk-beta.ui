# Canvas vector — completeness map

*Last updated: 2026-09-29*

> The pan-and-zoom plane every product canvas shares, each capability verdicted per the SDK doctrine
> ([vector completeness](../../../../../../conventions/development/dev-cycle.md#vector-completeness--build-the-whole-vector-not-the-ask)):
> shipped · ship-now · defer-with-named-trigger · skip-with-reason.
>
> **Trigger:** Wheelhouse's service map needed zoom. Three canvases had each hand-rolled it: `NodeEditor` (private
> viewport, wheel always zooms), the atlas canvas screen (a `scale()` and three buttons) and Wheelhouse's map (a scroll
> region). `CanvasArea` (`presentation/layout/canvasArea/`) is the one plane they share.
> **Application rule:** [CanvasArea](../../../../../../conventions/development/frontend/core/mla/components/layout/canvasArea.md).

## Verdicts

| Capability | Verdict | Trigger or reason |
|---|---|---|
| Drag to pan, click suppressed only after a drag | shipped | |
| Two-pointer pinch about the midpoint, the remaining finger keeps dragging | shipped | |
| Ctrl/⌘ wheel and trackpad pinch zoom about the pointer, page zoom blocked | shipped | |
| Unmodified wheel pans, passing to the page at the content's edge | shipped | |
| Wheel-zooms mode for full-screen editors | shipped | |
| Bounded plane (scroll-like, short axis centered) and open plane | shipped | |
| Zoom in, out, reset to 100%, fit (never above 100%); min, max and step | shipped | |
| Keyboard: `+` `-` `0`, arrows and Shift-arrows, fields keep their keys | shipped | |
| Controlled `v-model:viewport`; uncontrolled opening at a zoom or `'fit'` | shipped | |
| Corner controls with a replacement slot and localized labels | shipped | |
| Re-clamp when the box or the content resizes | shipped | |
| Native link and image drag suppressed inside the plane | shipped | |
| `NodeEditor` renders on `CanvasArea` (`bounds: 'none'`, `wheel: 'zoom'`) | ship-now | Two viewports in one SDK drift; do in the completion pass |
| Atlas canvas screen renders on `CanvasArea` | ship-now | The canvas-islands archetype must show the SDK plane |
| Browser tests: real layout, pointer capture, trackpad pinch, three engines | ship-now | happy-dom has no layout or capture; `*.browser.test.ts` |
| Reveal a content rectangle (`focusRect`) — center and zoom to a node | ship-now | "Select, then show it" in every map and editor |
| Background pattern (dots, lines) that moves and scales with the plane | ship-now | The canvas affordance readers expect |
| Animated fit, reset and reveal, instant under reduced motion | ship-now | Jumps lose the reader's place |
| One-finger page scroll on phones (two fingers move the canvas) | defer | A phone-first product embeds a canvas in a scrolling page |
| Minimap | defer | A plane larger than about four screens |
| Space-drag panning | defer | An editor where a background drag selects instead of panning |
| Level-of-detail rendering by zoom | defer | A plane with hundreds of nodes |
| Viewport persistence (URL, storage) | skip | App concern; `v-model:viewport` already carries it |
| Marquee selection, snapping, connecting | skip | Editor behavior owned by `NodeEditor`, not the plane |
| Momentum panning | skip | Not a desktop control-plane idiom; conflicts with reduced motion |
| React parity | skip | The React package is parked |
