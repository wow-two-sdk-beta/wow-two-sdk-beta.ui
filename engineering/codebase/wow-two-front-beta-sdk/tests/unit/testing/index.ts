// Local play() test kit — mechanical helpers encoding the proven gotchas from
// docs/testing.md (Harness learnings + findings). NOT exported from the package;
// imports only 'storybook/test' so stories stay loadable in the SB catalog.
export { portal } from './portal';
export { expectVisible } from './expectVisible';
export { expectDismissed } from './expectDismissed';
export { expectFocusReturns } from './expectFocusReturns';
export { expectScrollLocked } from './expectScrollLocked';
export { expectScrollReleased } from './expectScrollReleased';
export { stubClipboard, type ClipboardStub } from './stubClipboard';
export { dragPointer, type DragPointerOptions } from './dragPointer';
