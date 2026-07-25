import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canCopy,
  canLegacyCopy,
  canReadClipboard,
  copyBlob,
  copyItems,
  copyText,
  getClipboardPermission,
  getPasteItems,
  legacyCopyText,
  readItems,
  readText,
  type ClipboardWriteItems,
} from '@src/foundation/clipboard';

// Node project — the slice is capability detection, promise plumbing, and DataTransfer parsing, so fake globals
// are all it needs; no DOM, no renderer. The hooks need both and live in `clipboard.browser.test.ts`.
//
// EVERY GLOBAL THIS FILE INSTALLS IS TORN DOWN IN `afterEach`. Node ships a real `globalThis.navigator` (with no
// `clipboard`) and no `document` / `ClipboardItem` at all, so a leaked stub would silently turn the SSR and
// `unsupported` assertions green — they would be asserting against another test's fake rather than against a
// genuinely absent API.

/** The members of `navigator` this slice touches. Each test installs only the ones its case needs. */
interface NavigatorStub {
  clipboard?: unknown;
  permissions?: { query: (descriptor: { name: string }) => Promise<unknown> };
}

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

/** Replaces `globalThis.navigator` with `stub` for the duration of a test. */
function installNavigator(stub: NavigatorStub): void {
  Object.defineProperty(globalThis, 'navigator', { value: stub, configurable: true, writable: true });
}

/** Removes `navigator` entirely — the genuine SSR shape, which no amount of member-stubbing reproduces. */
function removeNavigator(): void {
  delete (globalThis as { navigator?: unknown }).navigator;
}

/** Installs an arbitrary global (`document`, `ClipboardItem`) that Node does not define. */
function installGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

/** Removes a global installed by {@link installGlobal}. */
function removeGlobal(name: string): void {
  delete (globalThis as Record<string, unknown>)[name];
}

afterEach(() => {
  removeNavigator();
  if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  removeGlobal('document');
  removeGlobal('ClipboardItem');
  vi.restoreAllMocks();
});

/** The rejection a browser produces for a refused permission or a call outside a user gesture. */
function notAllowedError(): DOMException {
  return new DOMException('Write permission denied.', 'NotAllowedError');
}

/** A `navigator.clipboard` that records `writeText` calls; `reject` makes each write fail after recording. */
function recordingClipboard(reject?: unknown): { writes: string[]; clipboard: NavigatorStub['clipboard'] } {
  const writes: string[] = [];
  return {
    writes,
    clipboard: {
      writeText: (text: string) => {
        writes.push(text);
        return reject === undefined ? Promise.resolve() : Promise.reject(reject);
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------------------
// Legacy `execCommand` fakes
// ---------------------------------------------------------------------------------------------------------

/** The subset of `<textarea>` the legacy path drives, plus the attach/detach bookkeeping the tests assert on. */
interface TextareaStub {
  value: string;
  attached: boolean;
  removeCalls: number;
  readonly attributes: Record<string, string>;
  readonly style: { cssText: string };
  readonly selections: [number, number][];
  focus: () => void;
  select: () => void;
  setSelectionRange: (start: number, end: number) => void;
  setAttribute: (name: string, value: string) => void;
  remove: () => void;
  parentNode: null;
}

/** What a fake document records, so a test can assert on the temporary element's whole lifecycle. */
interface DocumentHarness {
  /** Every textarea `createElement` handed out — normally exactly one per copy. */
  readonly created: TextareaStub[];
  /** The payloads `execCommand('copy')` was asked to run for. */
  readonly commands: string[];
  /** Elements still attached to the fake body. MUST be empty after any copy attempt. */
  readonly attached: TextareaStub[];
}

/**
 * Installs a fake `document` exposing just enough for the legacy path, and returns the harness recording it.
 *
 * `execCommand` behaviour is the axis under test: `true` = the browser copied, `false` = the browser refused
 * (the legacy API's only way to say no), `'throw'` = a hardened page or an extension breaking the call.
 */
function installDocument(execCommand: boolean | 'throw'): DocumentHarness {
  const created: TextareaStub[] = [];
  const commands: string[] = [];
  const attached: TextareaStub[] = [];

  const body = {
    appendChild: (element: TextareaStub) => {
      element.attached = true;
      attached.push(element);
      return element;
    },
  };

  const document = {
    activeElement: null,
    body,
    createElement: (): TextareaStub => {
      const element: TextareaStub = {
        value: '',
        attached: false,
        removeCalls: 0,
        attributes: {},
        style: { cssText: '' },
        selections: [],
        focus: () => undefined,
        select: () => undefined,
        setSelectionRange: (start: number, end: number) => {
          element.selections.push([start, end]);
        },
        setAttribute: (name: string, value: string) => {
          element.attributes[name] = value;
        },
        remove: () => {
          element.removeCalls++;
          element.attached = false;
          const index = attached.indexOf(element);
          if (index >= 0) attached.splice(index, 1);
        },
        parentNode: null,
      };
      created.push(element);
      return element;
    },
    execCommand: (command: string): boolean => {
      commands.push(command);
      if (execCommand === 'throw') throw new Error('execCommand is disabled on this page');
      return execCommand;
    },
  };

  installGlobal('document', document);
  return { created, commands, attached };
}

/** A stand-in `ClipboardItem` constructor — Node has none, and `copyItems` refuses to run without one. */
class FakeClipboardItem {
  public constructor(public readonly representations: Record<string, Blob>) {}
}

/** Installs the fake `ClipboardItem` plus a `navigator.clipboard.write` recording every item handed to it. */
function installItemWriter(reject?: unknown): { items: FakeClipboardItem[] } {
  const items: FakeClipboardItem[] = [];
  installGlobal('ClipboardItem', FakeClipboardItem);
  installNavigator({
    clipboard: {
      write: (written: FakeClipboardItem[]) => {
        items.push(...written);
        return reject === undefined ? Promise.resolve() : Promise.reject(reject);
      },
    },
  });
  return { items };
}

// ---------------------------------------------------------------------------------------------------------
// Paste fakes
// ---------------------------------------------------------------------------------------------------------

/** Builds a synthetic `DataTransfer`-shaped object — the slice never uses the real class, only its surface. */
function fakeDataTransfer(options: {
  data?: Record<string, string>;
  items?: { kind: string; getAsFile: () => File | null }[];
  files?: File[];
}): unknown {
  return {
    getData: (type: string) => options.data?.[type] ?? '',
    items: options.items,
    files: options.files,
  };
}

/** Wraps a `DataTransfer` stand-in in a `paste`-event-shaped object. */
function fakePasteEvent(clipboardData: unknown): ClipboardEvent {
  return { clipboardData } as unknown as ClipboardEvent;
}

/** A one-pixel stand-in `File` for the paste-files cases. */
function testFile(name = 'a.txt'): File {
  return new File(['x'], name, { type: 'text/plain' });
}

// ---------------------------------------------------------------------------------------------------------

describe('capability detection', () => {
  it('reports everything unavailable under SSR — no navigator, no document', () => {
    removeNavigator();
    expect(typeof navigator).toBe('undefined');

    expect(() => canCopy()).not.toThrow();
    expect(canCopy()).toBe(false);
    expect(canReadClipboard()).toBe(false);
    expect(canLegacyCopy()).toBe(false);
  });

  it('reports unavailable when navigator exists but exposes no clipboard', () => {
    installNavigator({});
    expect(canCopy()).toBe(false);
    expect(canReadClipboard()).toBe(false);
  });

  it('probes each method separately — writeText present, readText absent', () => {
    installNavigator({ clipboard: { writeText: () => Promise.resolve() } });
    expect(canCopy()).toBe(true);
    expect(canReadClipboard()).toBe(false);
  });

  it('reads false rather than throwing when the clipboard getter itself throws', () => {
    const stub = {};
    Object.defineProperty(stub, 'clipboard', {
      get: () => {
        throw new Error('hardened page');
      },
    });
    installNavigator(stub);

    expect(() => canCopy()).not.toThrow();
    expect(canCopy()).toBe(false);
  });

  it('reports the legacy path available only when document.execCommand exists', () => {
    expect(canLegacyCopy()).toBe(false);
    installDocument(true);
    expect(canLegacyCopy()).toBe(true);
  });
});

describe('copyText', () => {
  it('resolves copied when the Clipboard API write succeeds', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await expect(copyText('https://example.com')).resolves.toEqual({ status: 'copied' });
    expect(clip.writes).toEqual(['https://example.com']);
  });

  it('resolves unsupported under SSR — never rejects', async () => {
    removeNavigator();
    await expect(copyText('x')).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves unsupported when the clipboard exposes no writeText', async () => {
    installNavigator({ clipboard: {} });
    await expect(copyText('x')).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves denied on a NotAllowedError — distinct from failed', async () => {
    const onError = vi.fn();
    const refusal = notAllowedError();
    installNavigator({ clipboard: recordingClipboard(refusal).clipboard });

    const result = await copyText('x', { onError });

    expect(result).toEqual({ status: 'denied', error: refusal });
    expect(result.status).not.toBe('failed');
    expect(onError).toHaveBeenCalledExactlyOnceWith(refusal);
  });

  it('resolves denied on a SecurityError — the non-secure-context refusal', async () => {
    const refusal = new DOMException('Insecure context.', 'SecurityError');
    installNavigator({ clipboard: recordingClipboard(refusal).clipboard });

    await expect(copyText('x')).resolves.toEqual({ status: 'denied', error: refusal });
  });

  it('resolves failed on a generic rejection, reporting the normalized error', async () => {
    const onError = vi.fn();
    const boom = new Error('boom');
    installNavigator({ clipboard: recordingClipboard(boom).clipboard });

    const result = await copyText('x', { onError });

    expect(result).toEqual({ status: 'failed', error: boom });
    expect(onError).toHaveBeenCalledExactlyOnceWith(boom);
  });

  it('normalizes a non-Error rejection into an Error', async () => {
    installNavigator({ clipboard: recordingClipboard('nope').clipboard });

    const result = await copyText('x');

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('nope');
  });

  it('resolves failed rather than rejecting when writeText throws synchronously', async () => {
    installNavigator({
      clipboard: {
        writeText: () => {
          throw new Error('sync throw');
        },
      },
    });

    await expect(copyText('x')).resolves.toMatchObject({ status: 'failed' });
  });

  it('never reports unsupported through onError — a capability fact is not a failure', async () => {
    const onError = vi.fn();
    removeNavigator();

    await copyText('x', { onError });
    expect(onError).not.toHaveBeenCalled();
  });

  it('absorbs a throw from the consumer onError callback', async () => {
    const onError = vi.fn(() => {
      throw new Error('reporter exploded');
    });
    installNavigator({ clipboard: recordingClipboard(new Error('boom')).clipboard });

    await expect(copyText('x', { onError })).resolves.toMatchObject({ status: 'failed' });
    expect(onError).toHaveBeenCalledOnce();
  });

  it('copies an empty string — a valid payload, not a no-op', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await expect(copyText('')).resolves.toEqual({ status: 'copied' });
    expect(clip.writes).toEqual(['']);
  });
});

describe('copyItems — multi-format', () => {
  it('writes text and HTML as ONE item so a rich target keeps formatting and a plain one still pastes', async () => {
    const writer = installItemWriter();
    const payload: ClipboardWriteItems = { 'text/plain': 'Total: 42', 'text/html': '<b>Total:</b> 42' };

    await expect(copyItems(payload)).resolves.toEqual({ status: 'copied' });

    // One item, both representations — two sequential writes would have clobbered each other.
    expect(writer.items).toHaveLength(1);
    const item = writer.items.at(0);
    expect(item).toBeDefined();
    expect(Object.keys(item?.representations ?? {}).sort()).toEqual(['text/html', 'text/plain']);
  });

  it('wraps string representations in a Blob typed with its own MIME key', async () => {
    const writer = installItemWriter();
    await copyItems({ 'text/plain': 'plain', 'text/html': '<b>rich</b>' });

    const representations = writer.items.at(0)?.representations;
    const plain = representations?.['text/plain'];
    const html = representations?.['text/html'];

    expect(plain).toBeInstanceOf(Blob);
    expect(html).toBeInstanceOf(Blob);
    expect(plain?.type).toBe('text/plain');
    expect(html?.type).toBe('text/html');
    await expect(plain?.text()).resolves.toBe('plain');
    await expect(html?.text()).resolves.toBe('<b>rich</b>');
  });

  it('passes a Blob representation through untouched', async () => {
    const writer = installItemWriter();
    const blob = new Blob(['binary'], { type: 'image/png' });

    await copyItems({ 'image/png': blob });
    expect(writer.items.at(0)?.representations['image/png']).toBe(blob);
  });

  it('resolves unsupported when ClipboardItem is absent even though write exists', async () => {
    installNavigator({ clipboard: { write: () => Promise.resolve() } });
    await expect(copyItems({ 'text/plain': 'x' })).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves unsupported under SSR', async () => {
    removeNavigator();
    await expect(copyItems({ 'text/plain': 'x' })).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves denied on a NotAllowedError from write', async () => {
    const refusal = notAllowedError();
    installItemWriter(refusal);

    await expect(copyItems({ 'text/plain': 'x' })).resolves.toEqual({ status: 'denied', error: refusal });
  });

  it('resolves failed for an empty payload rather than claiming a copy', async () => {
    installItemWriter();
    const result = await copyItems({});

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
  });
});

describe('copyBlob', () => {
  it('writes the blob under its own type by default', async () => {
    const writer = installItemWriter();
    const blob = new Blob(['png bytes'], { type: 'image/png' });

    await expect(copyBlob(blob)).resolves.toEqual({ status: 'copied' });
    expect(Object.keys(writer.items.at(0)?.representations ?? {})).toEqual(['image/png']);
  });

  it('prefers an explicit mimeType over the blob type', async () => {
    const writer = installItemWriter();
    const blob = new Blob(['data'], { type: 'application/json' });

    await copyBlob(blob, 'text/plain');
    expect(Object.keys(writer.items.at(0)?.representations ?? {})).toEqual(['text/plain']);
  });

  it('falls back to application/octet-stream for a typeless blob', async () => {
    const writer = installItemWriter();

    await copyBlob(new Blob(['data']));
    expect(Object.keys(writer.items.at(0)?.representations ?? {})).toEqual(['application/octet-stream']);
  });
});

describe('legacy execCommand fallback', () => {
  it('is NOT used unless the caller opts in', async () => {
    const harness = installDocument(true);
    removeNavigator();

    await expect(copyText('x')).resolves.toEqual({ status: 'unsupported' });
    expect(harness.commands).toEqual([]);
    expect(harness.created).toEqual([]);
  });

  it('copies through execCommand when the Clipboard API is absent', async () => {
    const harness = installDocument(true);
    removeNavigator();

    await expect(copyText('hello', { legacyFallback: true })).resolves.toEqual({ status: 'copied' });
    expect(harness.commands).toEqual(['copy']);
    expect(harness.created.at(0)?.value).toBe('hello');
    expect(harness.created.at(0)?.selections).toEqual([[0, 'hello'.length]]);
  });

  it('REMOVES the temporary element on the success path', async () => {
    const harness = installDocument(true);
    removeNavigator();

    await copyText('hello', { legacyFallback: true });

    expect(harness.created).toHaveLength(1);
    expect(harness.attached).toEqual([]);
    expect(harness.created.at(0)?.attached).toBe(false);
    expect(harness.created.at(0)?.removeCalls).toBe(1);
  });

  it('REMOVES the temporary element even when execCommand throws', async () => {
    const harness = installDocument('throw');
    removeNavigator();

    // The throw must not escape...
    const result = await copyText('hello', { legacyFallback: true });
    expect(result.status).toBe('failed');

    // ...and must not strand a focus-stealing textarea in the DOM.
    expect(harness.created).toHaveLength(1);
    expect(harness.attached).toEqual([]);
    expect(harness.created.at(0)?.attached).toBe(false);
    expect(harness.created.at(0)?.removeCalls).toBe(1);
  });

  it('removes the temporary element when execCommand reports refusal', async () => {
    const harness = installDocument(false);
    removeNavigator();

    await expect(copyText('hello', { legacyFallback: true })).resolves.toMatchObject({ status: 'failed' });
    expect(harness.attached).toEqual([]);
  });

  it('leaves nothing attached across repeated failing attempts', async () => {
    const harness = installDocument('throw');
    removeNavigator();

    await copyText('a', { legacyFallback: true });
    await copyText('b', { legacyFallback: true });
    await copyText('c', { legacyFallback: true });

    expect(harness.created).toHaveLength(3);
    expect(harness.attached).toEqual([]);
  });

  it('retries a denied Clipboard API write and reports copied when the legacy path succeeds', async () => {
    const harness = installDocument(true);
    installNavigator({ clipboard: recordingClipboard(notAllowedError()).clipboard });

    await expect(copyText('hello', { legacyFallback: true })).resolves.toEqual({ status: 'copied' });
    expect(harness.commands).toEqual(['copy']);
  });

  it('keeps the Clipboard API diagnosis when the legacy retry also fails', async () => {
    const refusal = notAllowedError();
    installDocument(false);
    installNavigator({ clipboard: recordingClipboard(refusal).clipboard });

    // `denied` outranks the legacy `failed` — it is the more specific account of what went wrong.
    await expect(copyText('hello', { legacyFallback: true })).resolves.toEqual({
      status: 'denied',
      error: refusal,
    });
  });

  it('reports the failure ONCE through onError despite two attempts', async () => {
    const onError = vi.fn();
    installDocument(false);
    installNavigator({ clipboard: recordingClipboard(notAllowedError()).clipboard });

    await copyText('hello', { legacyFallback: true, onError });
    expect(onError).toHaveBeenCalledOnce();
  });

  it('degrades a multi-format write to its text/plain arm', async () => {
    const harness = installDocument(true);
    removeNavigator();

    await expect(
      copyItems({ 'text/plain': 'plain', 'text/html': '<b>rich</b>' }, { legacyFallback: true }),
    ).resolves.toEqual({ status: 'copied' });
    expect(harness.created.at(0)?.value).toBe('plain');
  });

  it('does not degrade a multi-format write with no string text arm', async () => {
    const harness = installDocument(true);
    removeNavigator();

    await expect(copyItems({ 'image/png': new Blob(['x']) }, { legacyFallback: true })).resolves.toEqual({
      status: 'unsupported',
    });
    expect(harness.created).toEqual([]);
  });

  it('resolves unsupported under SSR — no document to build a textarea in', () => {
    expect(legacyCopyText('x')).toEqual({ status: 'unsupported' });
  });

  it('restores focus to the previously focused element', async () => {
    const harness = installDocument(true);
    const focus = vi.fn();
    (globalThis as { document?: { activeElement?: unknown } }).document!.activeElement = { focus };
    removeNavigator();

    await copyText('hello', { legacyFallback: true });

    expect(focus).toHaveBeenCalledOnce();
    expect(harness.attached).toEqual([]);
  });
});

describe('readText', () => {
  it('resolves read with the clipboard text', async () => {
    installNavigator({ clipboard: { readText: () => Promise.resolve('pasted') } });
    await expect(readText()).resolves.toEqual({ status: 'read', text: 'pasted' });
  });

  it('resolves read with an empty string — an empty clipboard is not a failure', async () => {
    installNavigator({ clipboard: { readText: () => Promise.resolve('') } });
    await expect(readText()).resolves.toEqual({ status: 'read', text: '' });
  });

  it('resolves unsupported under SSR', async () => {
    removeNavigator();
    await expect(readText()).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves unsupported — not failed — where readText is absent, as in Firefox page script', async () => {
    const onError = vi.fn();
    // Firefox exposes `writeText` but withholds reading from page script entirely.
    installNavigator({ clipboard: { writeText: () => Promise.resolve() } });

    const result = await readText({ onError });

    expect(result).toEqual({ status: 'unsupported' });
    expect(result.status).not.toBe('failed');
    expect(onError).not.toHaveBeenCalled();
  });

  it('resolves denied when the user dismisses the paste prompt', async () => {
    const onError = vi.fn();
    const refusal = notAllowedError();
    installNavigator({ clipboard: { readText: () => Promise.reject(refusal) } });

    const result = await readText({ onError });

    expect(result).toEqual({ status: 'denied', error: refusal });
    expect(onError).toHaveBeenCalledExactlyOnceWith(refusal);
  });

  it('resolves failed on a generic rejection', async () => {
    const boom = new Error('boom');
    installNavigator({ clipboard: { readText: () => Promise.reject(boom) } });

    await expect(readText()).resolves.toEqual({ status: 'failed', error: boom });
  });

  it('resolves failed when readText resolves with a non-string', async () => {
    installNavigator({ clipboard: { readText: () => Promise.resolve(42) } });
    await expect(readText()).resolves.toMatchObject({ status: 'failed' });
  });
});

describe('readItems', () => {
  it('flattens every representation the platform offers', async () => {
    const plain = new Blob(['plain'], { type: 'text/plain' });
    const html = new Blob(['<b>rich</b>'], { type: 'text/html' });
    installNavigator({
      clipboard: {
        read: () =>
          Promise.resolve([
            {
              types: ['text/plain', 'text/html'],
              getType: (type: string) => Promise.resolve(type === 'text/plain' ? plain : html),
            },
          ]),
      },
    });

    const result = await readItems();

    expect(result.status).toBe('read');
    if (result.status !== 'read') throw new Error('unreachable — narrowing guard');
    expect(result.items).toEqual([
      { type: 'text/plain', blob: plain },
      { type: 'text/html', blob: html },
    ]);
  });

  it('skips a representation that fails to materialize, keeping the rest', async () => {
    const plain = new Blob(['plain'], { type: 'text/plain' });
    installNavigator({
      clipboard: {
        read: () =>
          Promise.resolve([
            {
              types: ['text/plain', 'application/x-exotic'],
              getType: (type: string) =>
                type === 'text/plain' ? Promise.resolve(plain) : Promise.reject(new Error('no such type')),
            },
          ]),
      },
    });

    const result = await readItems();

    expect(result.status).toBe('read');
    if (result.status !== 'read') throw new Error('unreachable — narrowing guard');
    expect(result.items).toEqual([{ type: 'text/plain', blob: plain }]);
  });

  it('resolves unsupported where read is absent', async () => {
    installNavigator({ clipboard: { readText: () => Promise.resolve('x') } });
    await expect(readItems()).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves denied on a NotAllowedError', async () => {
    const refusal = notAllowedError();
    installNavigator({ clipboard: { read: () => Promise.reject(refusal) } });

    await expect(readItems()).resolves.toEqual({ status: 'denied', error: refusal });
  });
});

describe('getPasteItems', () => {
  it('extracts text and HTML from a paste event', () => {
    const event = fakePasteEvent(
      fakeDataTransfer({ data: { 'text/plain': 'plain text', 'text/html': '<b>rich</b>' } }),
    );

    expect(getPasteItems(event)).toEqual({ text: 'plain text', html: '<b>rich</b>', files: [] });
  });

  it('leaves a representation undefined when the paste did not carry it', () => {
    const event = fakePasteEvent(fakeDataTransfer({ data: { 'text/plain': 'only text' } }));

    const items = getPasteItems(event);
    expect(items.text).toBe('only text');
    expect(items.html).toBeUndefined();
  });

  it('extracts files from the DataTransfer item list', () => {
    const file = testFile('screenshot.png');
    const event = fakePasteEvent(
      fakeDataTransfer({
        data: { 'text/plain': '' },
        items: [
          { kind: 'string', getAsFile: () => null },
          { kind: 'file', getAsFile: () => file },
        ],
      }),
    );

    const items = getPasteItems(event);
    expect(items.files).toEqual([file]);
    expect(items.text).toBeUndefined();
  });

  it('falls back to DataTransfer.files when the item list yields nothing', () => {
    const file = testFile('doc.txt');
    const event = fakePasteEvent(fakeDataTransfer({ items: [], files: [file] }));

    expect(getPasteItems(event).files).toEqual([file]);
  });

  it('does not double-count a file present in both items and files', () => {
    const file = testFile();
    const event = fakePasteEvent(
      fakeDataTransfer({ items: [{ kind: 'file', getAsFile: () => file }], files: [file] }),
    );

    expect(getPasteItems(event).files).toEqual([file]);
  });

  it('extracts text and files together from one paste', () => {
    const file = testFile('image.png');
    const event = fakePasteEvent(
      fakeDataTransfer({
        data: { 'text/plain': 'caption', 'text/html': '<p>caption</p>' },
        items: [{ kind: 'file', getAsFile: () => file }],
      }),
    );

    expect(getPasteItems(event)).toEqual({ text: 'caption', html: '<p>caption</p>', files: [file] });
  });

  it('skips an item whose getAsFile throws, keeping the others', () => {
    const file = testFile();
    const event = fakePasteEvent(
      fakeDataTransfer({
        items: [
          {
            kind: 'file',
            getAsFile: () => {
              throw new Error('detached item');
            },
          },
          { kind: 'file', getAsFile: () => file },
        ],
      }),
    );

    expect(() => getPasteItems(event)).not.toThrow();
    expect(getPasteItems(event).files).toEqual([file]);
  });

  it('returns the empty shape for an event with no clipboardData', () => {
    expect(getPasteItems(fakePasteEvent(null))).toEqual({ text: undefined, html: undefined, files: [] });
  });

  it('returns the empty shape rather than throwing when getData throws', () => {
    const event = fakePasteEvent({
      getData: () => {
        throw new Error('called outside dispatch');
      },
    });

    expect(() => getPasteItems(event)).not.toThrow();
    expect(getPasteItems(event)).toEqual({ text: undefined, html: undefined, files: [] });
  });
});

describe('getClipboardPermission', () => {
  it('queries clipboard-read / clipboard-write by mode', async () => {
    const names: string[] = [];
    installNavigator({
      permissions: {
        query: (descriptor: { name: string }) => {
          names.push(descriptor.name);
          return Promise.resolve({ state: 'granted' });
        },
      },
    });

    await expect(getClipboardPermission('read')).resolves.toBe('granted');
    await expect(getClipboardPermission('write')).resolves.toBe('granted');
    expect(names).toEqual(['clipboard-read', 'clipboard-write']);
  });

  it('answers unsupported where the Permissions API is absent', async () => {
    installNavigator({});
    await expect(getClipboardPermission('read')).resolves.toBe('unsupported');
  });

  it('answers unsupported when the engine rejects the name — Safari throws synchronously', async () => {
    installNavigator({
      permissions: {
        query: () => {
          throw new TypeError("'clipboard-read' is not a valid enum value.");
        },
      },
    });

    await expect(getClipboardPermission('read')).resolves.toBe('unsupported');
  });

  it('answers unsupported under SSR', async () => {
    removeNavigator();
    await expect(getClipboardPermission('write')).resolves.toBe('unsupported');
  });
});

describe('hostile input — nothing throws, everything answers', () => {
  it('answers every write entry point given junk instead of a payload', async () => {
    installNavigator({ clipboard: recordingClipboard().clipboard });

    const junk: unknown[] = [undefined, null, 42, Symbol('nope'), {}, [], () => undefined];

    for (const value of junk) {
      await expect(copyText(value as string)).resolves.toMatchObject({ status: expect.any(String) });
      await expect(copyItems(value as ClipboardWriteItems)).resolves.toMatchObject({
        status: expect.any(String),
      });
      await expect(copyBlob(value as Blob)).resolves.toMatchObject({ status: expect.any(String) });
    }
  });

  it('answers rather than throwing when navigator members are throwing getters', async () => {
    const clipboard = {};
    Object.defineProperty(clipboard, 'writeText', {
      get: () => {
        throw new Error('trapped');
      },
    });
    Object.defineProperty(clipboard, 'readText', {
      get: () => {
        throw new Error('trapped');
      },
    });
    installNavigator({ clipboard });

    await expect(copyText('x')).resolves.toEqual({ status: 'unsupported' });
    await expect(readText()).resolves.toEqual({ status: 'unsupported' });
  });

  it('answers when the clipboard methods resolve with nonsense', async () => {
    installNavigator({
      clipboard: {
        writeText: () => Promise.resolve('unexpected'),
        readText: () => Promise.resolve(null),
        read: () => Promise.resolve('not an array'),
      },
    });

    await expect(copyText('x')).resolves.toEqual({ status: 'copied' });
    await expect(readText()).resolves.toMatchObject({ status: 'failed' });
    await expect(readItems()).resolves.toMatchObject({ status: 'failed' });
  });

  it('answers when a read item lies about its own shape', async () => {
    installNavigator({
      clipboard: {
        read: () => Promise.resolve([null, 'string', { types: 'not-an-array' }, { types: [1, 2] }]),
      },
    });

    await expect(readItems()).resolves.toEqual({ status: 'read', items: [] });
  });

  it('answers every paste entry point given junk instead of an event', () => {
    const junk: unknown[] = [undefined, null, 42, 'paste', {}, { clipboardData: 'nope' }];

    for (const value of junk) {
      expect(() => getPasteItems(value as ClipboardEvent)).not.toThrow();
      expect(getPasteItems(value as ClipboardEvent)).toEqual({
        text: undefined,
        html: undefined,
        files: [],
      });
    }
  });

  it('answers when the document itself is hostile during a legacy copy', async () => {
    installGlobal('document', {
      execCommand: () => true,
      get body() {
        throw new Error('trapped body');
      },
      createElement: () => {
        throw new Error('trapped createElement');
      },
    });
    removeNavigator();

    await expect(copyText('x', { legacyFallback: true })).resolves.toMatchObject({ status: 'failed' });
  });
});
