/* Transition / animation utility extensions — duration normalization, defaults. Call as `TransitionExtensions.x(...)`. */

// =============================================================================
// Types — presence-style asymmetric durations (enter/exit). Not every animation
// has an enter/exit phase (loops, one-shots, springs); this shape applies
// specifically to mount/unmount or appear/disappear transitions.
// =============================================================================

/** Input prop — symmetric number OR asymmetric `{ enter, exit }`. */
export type PresenceAnimationDurationProp =
  | number
  | { enter?: number; exit?: number };

/** Resolved (canonical) — both sides always present. */
export interface PresenceAnimationDuration {
  enter: number;
  exit: number;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULT_DURATION_MS = 200;

// =============================================================================
// Internal resolvers
// =============================================================================

function resolveDuration(
  d: PresenceAnimationDurationProp | undefined,
): PresenceAnimationDuration {
  if (typeof d === 'number') return { enter: d, exit: d };
  if (d && typeof d === 'object') {
    return {
      enter: d.enter ?? DEFAULT_DURATION_MS,
      exit:  d.exit  ?? DEFAULT_DURATION_MS,
    };
  }
  return { enter: DEFAULT_DURATION_MS, exit: DEFAULT_DURATION_MS };
}

// =============================================================================
// Grouped namespace export
// =============================================================================

export const TransitionExtensions = {
  resolveDuration,
  duration: { default: DEFAULT_DURATION_MS },
} as const;
