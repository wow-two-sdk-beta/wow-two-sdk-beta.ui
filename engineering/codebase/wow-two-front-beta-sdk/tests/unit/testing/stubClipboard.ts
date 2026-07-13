export interface ClipboardStub {
  /** Every text handed to `writeText`, in call order (recorded in both modes). */
  readonly writes: string[];
  /** `'resolve'` (default): writes succeed · `'reject'`: writes reject after recording. Settable mid-story. */
  mode: 'resolve' | 'reject';
  /** Deletes the instance shadow — the real prototype clipboard is back. Call in `finally`. */
  restore: () => void;
}

/**
 * Deterministic `navigator.clipboard.writeText` stub — the headless harness
 * grants no clipboard permission, so the real `writeText` rejects (docs/
 * testing.md → It9 findings → "Clipboard headless"). Instance-level
 * `defineProperty` shadows the prototype getter; always `restore()` in
 * `finally` so the shadow never leaks into the next story.
 */
export function stubClipboard(mode: ClipboardStub['mode'] = 'resolve'): ClipboardStub {
  const writes: string[] = [];
  const stub: ClipboardStub = {
    writes,
    mode,
    restore: () => {
      delete (navigator as { clipboard?: unknown }).clipboard;
    },
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: (text: string) => {
        writes.push(text);
        return stub.mode === 'reject'
          ? Promise.reject(new Error('stubClipboard: writeText rejected'))
          : Promise.resolve();
      },
    },
    configurable: true,
  });
  return stub;
}
