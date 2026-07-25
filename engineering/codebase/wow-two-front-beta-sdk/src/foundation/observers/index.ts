// observers — foundation seam. The browser's element-watching APIs as headless hooks plus React-free cores:
// `IntersectionObserver` (is it on screen, and how much) and `MutationObserver` (did the DOM under it change).
//
// RESIZE IS NOT HERE. `useResizeObserver` already ships in `foundation/hooks` — import it from there. A second
// resize wrapper in this slice would be two hooks answering the same question with slightly different cleanup
// semantics, which is exactly the drift a foundation layer exists to prevent. This slice is intersection and
// mutation only.
//
// HOUSE RULES, which consumers should follow too:
//
//  - EVERY HOOK IS A LIFECYCLE WRAPPER OVER A REACT-FREE CORE. `observeIntersection` and `observeMutation` take
//    an element and a callback and return a disposer; the hooks add "which element, for how long, and when to
//    re-subscribe". Non-React code (a router guard, an analytics probe, a plain script) uses the cores directly
//    and gets identical semantics — the observer's behaviour is proven once, not once per hook.
//
//  - A `RefObject` MUTATING DOES NOT RE-RENDER, so every hook re-reads `ref.current` after each render and
//    diffs it against what is actually observed, rather than keying an effect on `[ref]` (which would observe
//    a node detached three renders ago and report a stale answer forever). The diff makes the steady state
//    free — same node, same options, immediate return. Options are compared by fingerprint, never by object
//    identity, so an inline options literal is fine and does not churn the subscription.
//
//  - NOTHING THROWS AND NOTHING LEAKS. A missing API (server-side render, pre-2019 browser) yields a no-op
//    disposer, and `useInView` then fails OPEN — `inView: true` — because reveal-on-scroll content stranded
//    invisible is worse than content shown early. That fallback is applied from an effect, never from initial
//    state, so the server and the first client render agree. Every hook disconnects on unmount.
//
//  - ONE OBSERVER FOR MANY TARGETS. `useIntersectionObserver` shares a single observer across a list;
//    `useInView` per row is the classic long-list performance mistake and the multi-element form exists to make
//    the right thing the easy thing.
//
// WHAT A CONSUMER STILL OWNS:
//  - The root's scrollability. An `IntersectionObserver` `root` must be an ancestor of its targets and is
//    normally the scroll container; pointing it at a sibling reports nothing, silently.
//  - Re-render cost. `useVisibility` fires once per crossed step by design — that is the feature — but a
//    `steps: 100` ladder on fifty elements is five thousand potential updates per scroll. Sample as coarsely
//    as the UI actually reads.
//  - Motion. Nothing here animates, so nothing here consults `useReducedMotion`. A consumer that TWEENS a
//    reveal or scrubs on `ratio` owns that call at its own layer (`foundation/hooks`).
//
// NOT HERE, on purpose:
//  - `ResizeObserver` — see above, it lives in `foundation/hooks`.
//  - `PerformanceObserver` / `ReportingObserver`. They observe the DOCUMENT's behaviour, not an element's, and
//    belong with instrumentation rather than in a UI element-watching slice.
//  - Scroll position. `IntersectionObserver` answers "is it visible", not "where is the scrollbar" —
//    `foundation/virtualization` owns windowing and offsets.

// Intersection core — React-free, the whole of the observation semantics
export {
  observeIntersection,
  supportsIntersectionObserver,
  type IntersectionOptions,
  type Disposer,
} from './ObserveIntersection';

// Mutation core — React-free, with the empty-init `TypeError` designed out
export { observeMutation, supportsMutationObserver, type MutationOptions } from './ObserveMutation';

// Pure arithmetic — the threshold ladder `useVisibility` samples with, independently testable
export { visibilityThresholds } from './VisibilitySteps';

// Is it on screen — the lazy-load / reveal-on-scroll primitive, with permanent `once`
export { useInView, type UseInViewOptions, type InViewState } from './UseInView';

// How much of it is on screen — `useInView` over a generated threshold ladder
export { useVisibility, type UseVisibilityOptions, type VisibilityState } from './UseVisibility';

// Many targets, ONE observer — the long-list form
export { useIntersectionObserver, type UseIntersectionObserverOptions } from './UseIntersectionObserver';

// Did the DOM under it change — for what React does not own
export { useMutationObserver, type UseMutationObserverOptions } from './UseMutationObserver';
