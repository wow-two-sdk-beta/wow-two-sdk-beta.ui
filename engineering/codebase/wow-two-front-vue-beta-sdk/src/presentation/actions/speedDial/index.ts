import SpeedDialRoot from './SpeedDial.vue';
import SpeedDialTrigger from './SpeedDialTrigger.vue';
import SpeedDialAction from './SpeedDialAction.vue';

/**
 * The dial root, carrying its parts as properties so `<SpeedDial.Trigger>` /
 * `<SpeedDial.Action>` resolve in a template — the counterpart of the React
 * original's `Object.assign`. Each part is also exported on its own name.
 */
const SpeedDial = Object.assign(SpeedDialRoot, {
  Trigger: SpeedDialTrigger,
  Action: SpeedDialAction,
});

export { SpeedDial, SpeedDialAction, SpeedDialTrigger };
export {
  SpeedDialDirection,
  SpeedDialKey,
  useSpeedDialContext,
  type SpeedDialContextValue,
  type SpeedDialPosition,
} from './SpeedDialContext';
export type { SpeedDialProps } from './SpeedDial.vue';
export type { SpeedDialTriggerProps } from './SpeedDialTrigger.vue';
export type { SpeedDialActionProps } from './SpeedDialAction.vue';
export default SpeedDial;
