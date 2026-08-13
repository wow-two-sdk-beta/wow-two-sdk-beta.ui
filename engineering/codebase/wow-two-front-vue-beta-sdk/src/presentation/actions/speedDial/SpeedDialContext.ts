import { inject, type InjectionKey, type ShallowRef } from 'vue';
import type { OverlayPosition } from '../../../foundation/utils';

/** The overlay anchor position of a SpeedDial (shared overlay vocabulary). */
export type SpeedDialPosition = OverlayPosition;

/** Defines the axis a SpeedDial's action items fan out along. */
export const SpeedDialDirection = {
  /** Refers to items stacking upward from the trigger. */
  Up: 'up',
  /** Refers to items stacking downward from the trigger. */
  Down: 'down',
  /** Refers to items stacking to the left of the trigger. */
  Left: 'left',
  /** Refers to items stacking to the right of the trigger. */
  Right: 'right',
} as const;

export type SpeedDialDirection = (typeof SpeedDialDirection)[keyof typeof SpeedDialDirection];

export interface SpeedDialContextValue {
  /** The open state. Live getter — read it, don't destructure it. */
  readonly open: boolean;

  /** Sets the open state (and fires the root's `open-change`). */
  setOpen: (open: boolean) => void;

  /**
   * The trigger's element, published by `SpeedDialTrigger` on mount. Escape and
   * action-select return focus here — the React original held a `MutableRefObject`
   * threaded through `composeRefs`; a Vue child writes its own element into this ref
   * instead.
   */
  triggerEl: ShallowRef<HTMLElement | null>;

  /** The resolved fan-out axis. Live getter. */
  readonly direction: SpeedDialDirection;

  /** The viewport anchor. Live getter. */
  readonly position: SpeedDialPosition;
}

export const SpeedDialKey: InjectionKey<SpeedDialContextValue> = Symbol('wow-two.speedDial');

/** Reads the surrounding `SpeedDial`. Throws outside one — the parts are not standalone. */
export function useSpeedDialContext(): SpeedDialContextValue {
  const context = inject(SpeedDialKey, null);
  if (!context) throw new Error('SpeedDial.* must be used inside <SpeedDial>');
  return context;
}
