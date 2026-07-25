// clipboard — foundation seam. The full Clipboard vector: writing (`copyText`, `copyBlob`, `copyItems`), the
// deprecated `execCommand` fallback for non-secure contexts, reading (`readText`, `readItems`), paste handling
// (`getPasteItems`, `usePasteHandler`), capability detection, the permission read, and the React binding
// `useClipboardCopy`. No HTTP, no components — a copy button is a consumer of these rules, not their owner;
// React appears only in the two `Use*` modules.
//
// DEFINING CONTRACT: NOTHING HERE THROWS. Every entry point is invoked from a click handler or an event listener
// and answers with a DISCRIMINATED RESULT — `copied` / `denied` / `unsupported` / `failed` for a write, `read`
// plus the same three failures for a read — instead of throwing or rejecting. `unsupported` is a first-class
// status rather than an error: SSR, a non-secure context, and Firefox's missing clipboard read are ordinary
// conditions a UI has to render, not exceptions to handle.
//
// WHY THE RESULT AND NOT REACT STATE. `foundation/hooks`' `useClipboard` (which still ships, and which this slice
// deliberately does not touch) resolves its `copy` on both success and failure, recording the error in state
// instead. That makes the outcome invisible to every caller that is not a component — the reason
// `foundation/share`'s `shareOrCopy` declined to use it and open-codes `navigator.clipboard.writeText` for its
// fallback leg. Here even the hook's `copy` resolves to the full result, so the awaiting caller branches on the
// outcome while `status` drives the render.
//
// PICK THE RIGHT PATH FOR READING — the three are not interchangeable:
//   - the user pastes → `getPasteItems` / `usePasteHandler`. NO permission, no prompt, works in every engine.
//     This is the right answer for almost every "paste an image" feature.
//   - the page reads without a paste → `readText` / `readItems`. Needs a user gesture AND an explicit permission
//     prompt; absent entirely in Firefox, where it answers `unsupported`.
//   - "may I read?" up front → `getClipboardPermission`, which answers `unsupported` in most browsers because
//     the permission NAME is not implemented. Not a gate — attempt the operation and branch on its result.
//
// Scope boundary: `foundation/share` owns the Web Share API and only writes to the clipboard as the fallback leg
// of a share; this slice owns the clipboard itself and knows nothing about sharing. `shareOrCopy` could delegate
// its `copyToClipboard` here without changing its own contract — the statuses line up — but that migration is a
// later pass, not this one.

export {
  type ClipboardFailure,
  type ClipboardWriteResult,
  type ClipboardWriteStatus,
  type ClipboardReadItem,
  type ClipboardReadTextResult,
  type ClipboardReadItemsResult,
  type ClipboardReadStatus,
  type ClipboardReadOptions,
  type ClipboardCopyOptions,
} from './ClipboardResult';

export {
  canCopy,
  canCopyItems,
  canReadClipboard,
  canLegacyCopy,
} from './ClipboardSupport';

export { copyText } from './CopyText';

export { copyItems, copyBlob, type ClipboardWriteItems } from './CopyItems';

export { legacyCopyText } from './LegacyCopy';

export { readText, readItems } from './ReadClipboard';

export { getPasteItems, type PasteItems } from './PasteItems';

export { usePasteHandler, type UsePasteHandlerOptions } from './UsePasteHandler';

export {
  useClipboardCopy,
  type ClipboardCopyControls,
  type ClipboardCopyState,
  type UseClipboardCopyOptions,
} from './UseClipboardCopy';

export { getClipboardPermission, type ClipboardPermissionMode } from './ClipboardPermission';
