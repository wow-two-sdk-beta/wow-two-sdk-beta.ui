// share — foundation seam. The Web Share vector: `canShare` (feature detection), `share` (native sheet, four
// typed outcomes), `shareOrCopy` (clipboard fallback for the desktop browsers that have no sheet), and
// `useShare` (a thin React state machine over the two). No HTTP, no components — a share button is a consumer
// of these rules, not their owner; React appears only in `UseShare`.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler and resolves to a
// discriminated result instead of rejecting, so a consumer never needs a `try` around a share. `dismissed` is a
// status of its own rather than an error: the user closing the native sheet must not raise a toast, and must not
// trigger the clipboard fallback either.
//
// Scope boundary: clipboard *UI* state stays in `foundation/hooks`' `useClipboard` (transient `copied` flag,
// auto-reset). This slice only writes, and only as the fallback leg of a share — see `ShareOrCopy.ts` for why
// the non-hook path cannot delegate to that hook.

export { type ShareData, shareFallbackText } from './ShareData';

export { canShare } from './CanShare';

export { share, type ShareResult, type ShareStatus, type ShareOptions } from './Share';

export {
  shareOrCopy,
  type ShareOrCopyResult,
  type ShareOrCopyStatus,
  type ShareOrCopyOptions,
} from './ShareOrCopy';

export { useShare, type ShareControls, type ShareState } from './UseShare';
