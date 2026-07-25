// The active breakpoint, resolved from a caller-supplied scale.
//
// WHY THE FIXED-SLOT FAN-OUT BELOW — the one non-obvious thing in this slice:
//
// Two rules collide here. Every media query in this library must go through `foundation/hooks`' `useMediaQuery`,
// so there is exactly one `matchMedia` implementation, one subscription model, and one SSR semantic. But the scale
// belongs to the caller, so the NUMBER of queries is not known at compile time — and a hook cannot be called in a
// loop. React identifies hooks purely by call order, so a scale that gained or lost a key mid-session would shift
// every later hook's identity and hand a component another hook's state.
//
// The way to satisfy both is a FIXED number of `useMediaQuery` calls — `MAX_BREAKPOINTS` of them, always, in the
// same order — with the slots a smaller scale leaves over parked on `'not all'`, a valid media query that can
// never match. Call count is constant, the shared primitive is still the only thing touching `matchMedia`, and an
// unused slot costs one inert `MediaQueryList`. The alternative — a bespoke `useSyncExternalStore` looping over N
// `MediaQueryList`s inside one subscription — would be the second `matchMedia` implementation this slice exists to
// avoid, so the ugliness is deliberate and belongs here rather than in the primitive.
//
// The slot count below MUST equal `MAX_BREAKPOINTS`. Queries arrive widest-first, so a scale with more entries
// than slots loses its NARROWEST ones — the widest, which decide the answer on large viewports, always get slots.

import { useMemo } from 'react';

import { useMediaQuery } from '../hooks';

import {
  resolveBreakpoint,
  toBreakpointQueries,
  type BreakpointQuery,
  type BreakpointScale,
} from './Breakpoints';

/** A valid media query that never matches — parks the slots a scale smaller than `MAX_BREAKPOINTS` leaves unused. */
const NEVER_MATCHES = 'not all';

/** Reads slot `index`'s query string, falling back to the never-matching parking query. */
function queryAt(queries: readonly BreakpointQuery[], index: number): string {
  return queries.at(index)?.query ?? NEVER_MATCHES;
}

/**
 * Resolves the active breakpoint from a caller-supplied scale: the key of the widest breakpoint the viewport
 * currently satisfies.
 *
 * No scale is built in — this library is Tailwind-v4 token-driven and the app owns its `@theme` breakpoints. Pass
 * `TAILWIND_BREAKPOINTS` to opt into Tailwind's defaults, or your own map to match your tokens.
 *
 * Prefer a module-level scale object over an inline literal. An inline one is re-compiled to queries on every
 * render; harmless, since the query STRINGS are what drive the subscriptions and those are unchanged, but wasted.
 *
 * Returns `null` under SSR, where no media query matches. Layout that must be right before JS runs belongs in CSS;
 * this hook is for behaviour a media query alone cannot express — which list virtualiser to mount, how many items
 * to prefetch.
 *
 * @param scale Breakpoint key to minimum viewport width in CSS pixels. Entries beyond `MAX_BREAKPOINTS`, counted
 * widest-first, are ignored; invalid widths are dropped.
 * @returns The active breakpoint key, or `null` when the viewport is narrower than every entry in the scale.
 */
export function useBreakpoint<TScale extends BreakpointScale>(
  scale: TScale,
): Extract<keyof TScale, string> | null {
  const queries = useMemo(() => toBreakpointQueries(scale), [scale]);

  // Fixed-arity fan-out — see this file's header. Do NOT collapse into a loop or a `.map`: the constant call count
  // is what makes a caller-supplied scale safe under the rules of hooks.
  const match0 = useMediaQuery(queryAt(queries, 0));
  const match1 = useMediaQuery(queryAt(queries, 1));
  const match2 = useMediaQuery(queryAt(queries, 2));
  const match3 = useMediaQuery(queryAt(queries, 3));
  const match4 = useMediaQuery(queryAt(queries, 4));
  const match5 = useMediaQuery(queryAt(queries, 5));
  const match6 = useMediaQuery(queryAt(queries, 6));
  const match7 = useMediaQuery(queryAt(queries, 7));

  // Exactly `MAX_BREAKPOINTS` entries — the invariant the header states. Positionally aligned with `queries`.
  const matches: readonly boolean[] = [
    match0,
    match1,
    match2,
    match3,
    match4,
    match5,
    match6,
    match7,
  ];

  return resolveBreakpoint(queries, matches);
}
