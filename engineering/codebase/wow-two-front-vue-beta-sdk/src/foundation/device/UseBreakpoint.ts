// The active breakpoint, resolved from a caller-supplied scale.
//
// WHY THE FIXED-SLOT FAN-OUT BELOW — the one non-obvious thing in this slice:
//
// Every media query in this library must go through `foundation/hooks`' `useMediaQuery`, so there is exactly one
// `matchMedia` implementation, one subscription model, and one SSR semantic. But the scale belongs to the caller,
// so the NUMBER of queries is not known at compile time.
//
// Vue has no rules-of-hooks call-order constraint, so the React original's reason for a fixed arity is gone — but
// the fixed arity stays, for a Vue-specific reason that is just as real: a composable's cleanup is registered on
// the surrounding effect scope, so subscriptions created in a loop are only released when the WHOLE scope dies. A
// scale that shrank mid-session would leak a live `MediaQueryList` per dropped entry. A FIXED number of
// `useMediaQuery` calls — `MAX_BREAKPOINTS` of them, always — has no such leak, and the slots a smaller scale
// leaves over are parked on `'not all'`, a valid media query that can never match.
//
// What Vue does buy is that each slot takes a GETTER rather than a fixed string, so a changed scale re-points the
// existing subscriptions instead of needing a remount. The React version could not do that at all.
//
// The slot count below MUST equal `MAX_BREAKPOINTS`. Queries arrive widest-first, so a scale with more entries
// than slots loses its NARROWEST ones — the widest, which decide the answer on large viewports, always get slots.

import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';

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
 * The scale may be a ref or getter; changing it re-points the existing subscriptions.
 *
 * Reads `null` under SSR, where no media query matches. Layout that must be right before JS runs belongs in CSS;
 * this composable is for behaviour a media query alone cannot express — which list virtualiser to mount, how many
 * items to prefetch.
 *
 * @param scale Breakpoint key to minimum viewport width in CSS pixels. Entries beyond `MAX_BREAKPOINTS`, counted
 * widest-first, are ignored; invalid widths are dropped.
 * @returns The active breakpoint key, or `null` when the viewport is narrower than every entry in the scale.
 */
export function useBreakpoint<TScale extends BreakpointScale>(
  scale: MaybeRefOrGetter<TScale>,
): ComputedRef<Extract<keyof TScale, string> | null> {
  const queries = computed(() => toBreakpointQueries(toValue(scale)));

  // Fixed-arity fan-out — see this file's header. Do NOT collapse into a loop or a `.map`: the constant call
  // count is what keeps a caller-supplied scale from leaking subscriptions as it shrinks.
  const match0 = useMediaQuery(() => queryAt(queries.value, 0));
  const match1 = useMediaQuery(() => queryAt(queries.value, 1));
  const match2 = useMediaQuery(() => queryAt(queries.value, 2));
  const match3 = useMediaQuery(() => queryAt(queries.value, 3));
  const match4 = useMediaQuery(() => queryAt(queries.value, 4));
  const match5 = useMediaQuery(() => queryAt(queries.value, 5));
  const match6 = useMediaQuery(() => queryAt(queries.value, 6));
  const match7 = useMediaQuery(() => queryAt(queries.value, 7));

  return computed(() => {
    // Exactly `MAX_BREAKPOINTS` entries — the invariant the header states. Positionally aligned with `queries`.
    const matches: readonly boolean[] = [
      match0.value,
      match1.value,
      match2.value,
      match3.value,
      match4.value,
      match5.value,
      match6.value,
      match7.value,
    ];

    return resolveBreakpoint(queries.value, matches) as Extract<keyof TScale, string> | null;
  });
}
