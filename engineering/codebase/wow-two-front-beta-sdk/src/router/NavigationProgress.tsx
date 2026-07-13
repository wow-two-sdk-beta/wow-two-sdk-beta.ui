import { useNavigation } from 'react-router-dom';

import { useOptionalNavigationProgress } from './UseNavigationProgress';

/** Defines the visual form of the navigation indicator — a slim top bar or a pulsing heartbeat. */
export const NavigationProgressVariant = {
  /** Refers to a slim indeterminate top bar. */
  Bar: 'bar',
  /** Refers to a pulsing heartbeat dot. */
  Heartbeat: 'heartbeat',
} as const;

export type NavigationProgressVariant = (typeof NavigationProgressVariant)[keyof typeof NavigationProgressVariant];

/** Defines which busy sources drive the indicator — route navigation, manual spans, or both. */
export const NavigationProgressMode = {
  /** Refers to route-navigation busy state (react-router). */
  Auto: 'auto',
  /** Refers to manual / backend busy spans. */
  Manual: 'manual',
  /** Refers to either busy source. */
  Both: 'both',
} as const;

export type NavigationProgressMode = (typeof NavigationProgressMode)[keyof typeof NavigationProgressMode];

/** Defines props for the navigation progress indicator. */
interface NavigationProgressProps {
  /** The visual form — a slim top bar (default) or a pulsing heartbeat. */
  readonly variant?: NavigationProgressVariant;

  /** The busy sources that toggle visibility — route (default), manual (backend), or both. */
  readonly mode?: NavigationProgressMode;

  /** The accessible label announced while the indicator is busy. */
  readonly 'aria-label'?: string;
}

/** Renders the navigation / backend-wait progress indicator — a slim bar or a pulsing heartbeat, shown only while busy. */
export function NavigationProgress(props: NavigationProgressProps) {
  const {
    variant = NavigationProgressVariant.Bar,
    mode = NavigationProgressMode.Auto,
    'aria-label': ariaLabel = 'Loading',
  } = props;

  // `useNavigation` covers lazy-chunk + loader waits; the optional context covers app data fetches.
  const routeBusy = useNavigation().state !== 'idle';
  const manualBusy = useOptionalNavigationProgress()?.isBusy ?? false;

  const isActive =
    mode === NavigationProgressMode.Manual
      ? manualBusy
      : mode === NavigationProgressMode.Both
        ? routeBusy || manualBusy
        : routeBusy;

  if (!isActive) return null;

  if (variant === NavigationProgressVariant.Heartbeat) {
    return (
      <div
        role="progressbar"
        aria-busy={true}
        aria-label={ariaLabel}
        data-variant={variant}
        className="fixed right-4 top-4 z-toast inline-flex h-3 w-3 items-center justify-center"
      >
        {/* Ping ring conveys the beat; reduced-motion drops it, leaving the solid dot as a static cue. */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping motion-reduce:hidden" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-busy={true}
      aria-label={ariaLabel}
      data-variant={variant}
      className="fixed inset-x-0 top-0 z-toast h-0.5 overflow-hidden"
    >
      {/* Indeterminate slide; reduced-motion pins it full-width and static. */}
      <div className="h-full w-1/3 bg-primary animate-indeterminate motion-reduce:w-full motion-reduce:animate-none" />
    </div>
  );
}
