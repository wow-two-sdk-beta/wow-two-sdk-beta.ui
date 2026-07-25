// animation — foundation seam. Imperative motion: a Web Animations API wrapper (`animate`) and the FLIP layout
// technique built on it (`measureRect` / `computeFlipTransform` / `playFlip`, the `useFlip` hook, and the
// `AnimatedLayout` container). Replaces hand-rolled `element.animate()` calls and the `requestAnimationFrame`
// tweens that appear whenever a list needs to reorder smoothly.
//
// HOUSE RULES, which consumers should follow too:
//
//  - LAYOUT, NOT PRESENCE. This slice animates elements that STAY MOUNTED and CHANGE POSITION. Enter/exit —
//    an element appearing or leaving the tree — is `foundation/primitives`' `Presence`, which defers unmount
//    until a CSS transition/animation ends. They compose: wrap a list item in `Presence` for its fade-in and
//    put the list in `AnimatedLayout` so its neighbours slide to their new places. Neither reimplements the
//    other, and nothing here holds an element mounted.
//
//  - REDUCED MOTION IS A PARAMETER, NOT A LOOKUP. Every pure entry point takes an explicit `reducedMotion`
//    option, so it stays testable (and usable) outside React. Only the React layer (`useFlip`,
//    `AnimatedLayout`) calls `foundation/hooks`' `useReducedMotion`, and an explicit option still overrides it.
//    Reduced motion NEVER skips the state change — it commits the final state instantly (`animate`) or leaves
//    the already-committed layout alone (`playFlip`).
//
//  - THE MATH IS PURE AND SEPARATELY TESTABLE. `computeFlipTransform` is four divisions over two plain rects,
//    exercised in the node project; the DOM shell around it is exercised in the browser project. New geometry
//    behaviour belongs in the pure function, where it can be tested without a layout engine.
//
//  - MEASURE BEFORE PAINT. Anything that snapshots geometry across a render must do it in `useLayoutEffect`.
//    A rect read in `useEffect` is post-paint, and the animation visibly jumps. `useFlip` encodes this.
//
// NOT HERE, on purpose:
//  - `useReducedMotion` — it lives in `foundation/hooks` and is not re-exported; one export site per hook.
//  - Scroll, gesture, and media-driven motion — separate foundation seams own those inputs.
//  - Spring/physics integration and enter/exit choreography — this is the primitive layer they would build on.

export {
  animate,
  applyFinalKeyframe,
  noopAnimationHandle,
  ANIMATION_DEFAULTS,
  type AnimateOptions,
  type AnimationHandle,
  type AnimationKeyframes,
} from './Animate';

export {
  measureRect,
  computeFlipTransform,
  isIdentityFlip,
  formatFlipTransform,
  playFlip,
  IDENTITY_FLIP_TRANSFORM,
  type FlipOptions,
  type FlipTransform,
  type RectLike,
} from './Flip';

export { useFlip, type UseFlipOptions } from './UseFlip';

export { AnimatedLayout, type AnimatedLayoutProps } from './AnimatedLayout';
