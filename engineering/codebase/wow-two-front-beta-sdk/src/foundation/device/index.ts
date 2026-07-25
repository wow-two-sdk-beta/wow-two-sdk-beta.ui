// device — foundation seam. What the environment can DO, asked one capability at a time: pointer precision and
// hover (`usePointerType` / `useHoverCapability`), the network link (`useOnlineStatus`), presentation and
// installed-ness (`useDisplayMode` / `useIsInstalled`), the active viewport breakpoint (`useBreakpoint`), and —
// last resort only — the OS family (`getPlatform`).
//
// HOUSE RULES, which consumers should follow too:
//
//  - CAPABILITY OVER IDENTITY. Every export here except `getPlatform` asks what the environment supports, not what
//    it is. `(pointer: coarse)` is a fact about the pointer in the user's hand; a user-agent string is a claim the
//    browser makes about itself, freely spoofed and increasingly frozen. Gate on the fact.
//
//  - ONE MEDIA-QUERY PRIMITIVE. Every reactive answer routes through `foundation/hooks`' `useMediaQuery`. There is
//    no second `matchMedia` in this slice, so subscription, teardown, and SSR semantics are identical everywhere —
//    including in `useBreakpoint`, which pays for that consistency with a fixed-slot fan-out (see its header).
//
//  - SSR RETURNS A SANE DEFAULT AND NEVER THROWS, then corrects on hydration: `'none'` pointer, no hover,
//    `'browser'` display mode, `null` breakpoint, `'unknown'` platform, and ONLINE. The bias is deliberate — never
//    render an alarming state for a client the server has not met.
//
// NOT HERE, on purpose:
//  - `useReducedMotion` lives in `foundation/hooks` and is NOT re-exported — one export site per hook, no aliasing.
//  - `isApplePlatform` stays in `foundation/shortcuts`, where it backs `mod` → ⌘ resolution. `getPlatform` builds
//    on it rather than sniffing a second time, so a ⌘ hint and a platform label can never disagree.
//  - Reachability beyond the link layer. `useOnlineStatus` reports what the browser knows; proving a server
//    answers takes a request to it, which belongs to `foundation/http`.

export { PointerType } from './PointerType';
export { usePointerType, useHoverCapability } from './UsePointer';

export { useOnlineStatus } from './UseOnlineStatus';

export { DisplayMode } from './DisplayMode';
export { useDisplayMode, useIsInstalled } from './UseDisplayMode';

export { Platform, getPlatform } from './Platform';

export {
  type BreakpointScale,
  type BreakpointQuery,
  TAILWIND_BREAKPOINTS,
  MAX_BREAKPOINTS,
  toBreakpointQueries,
  resolveBreakpoint,
} from './Breakpoints';
export { useBreakpoint } from './UseBreakpoint';
