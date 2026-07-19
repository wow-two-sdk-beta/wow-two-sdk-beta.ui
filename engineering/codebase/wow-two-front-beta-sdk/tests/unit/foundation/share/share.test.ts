import { afterEach, describe, expect, it, vi } from 'vitest';

import { canShare, share, shareFallbackText, shareOrCopy } from '@src/foundation/share';

// Node project — the whole slice is capability detection + promise plumbing, so a fake `navigator` is all it
// needs; no DOM, no renderer. Node ships a real `globalThis.navigator` (no `share`, no `clipboard`), so each
// test installs its own and `afterEach` puts the original descriptor back — a leaked stub would silently turn
// the SSR assertions green. `useShare` needs a renderer and lives in `useShare.browser.test.ts`.

/** The members of `navigator` this slice touches. Each test installs only the ones its case needs. */
interface NavigatorStub {
  share?: (data: unknown) => Promise<void>;
  canShare?: (data: unknown) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
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

afterEach(() => {
  removeNavigator();
  if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);
});

/** A `navigator.share` that records every payload it is handed and resolves (the sheet completed). */
function recordingShare(): { calls: unknown[]; share: (data: unknown) => Promise<void> } {
  const calls: unknown[] = [];
  return {
    calls,
    share: (data: unknown) => {
      calls.push(data);
      return Promise.resolve();
    },
  };
}

/** A `navigator.clipboard` that records writes; `mode: 'reject'` makes each write fail after recording. */
function recordingClipboard(mode: 'resolve' | 'reject' = 'resolve'): {
  writes: string[];
  clipboard: { writeText: (text: string) => Promise<void> };
} {
  const writes: string[] = [];
  return {
    writes,
    clipboard: {
      writeText: (text: string) => {
        writes.push(text);
        return mode === 'reject' ? Promise.reject(new Error('denied')) : Promise.resolve();
      },
    },
  };
}

/** The rejection a user gets for closing the native sheet — a real `DOMException`, as the platform throws. */
function abortError(): DOMException {
  return new DOMException('Share canceled', 'AbortError');
}

/** A one-pixel stand-in `File` for the files-payload cases. */
function testFile(): File {
  return new File(['x'], 'a.txt', { type: 'text/plain' });
}

describe('canShare', () => {
  it('returns false under SSR — no navigator at all', () => {
    removeNavigator();
    expect(typeof navigator).toBe('undefined');
    expect(() => canShare()).not.toThrow();
    expect(canShare()).toBe(false);
    expect(canShare({ url: 'https://example.com' })).toBe(false);
  });

  it('returns false when navigator exists but exposes no share', () => {
    installNavigator({});
    expect(canShare()).toBe(false);
    expect(canShare({ url: 'https://example.com' })).toBe(false);
  });

  it('returns true when navigator.share exists and the payload carries no files', () => {
    installNavigator({ share: () => Promise.resolve() });
    expect(canShare()).toBe(true);
    expect(canShare({ url: 'https://example.com' })).toBe(true);
  });

  it('defers a files payload to navigator.canShare', () => {
    const data = { url: 'https://example.com', files: [testFile()] };

    installNavigator({ share: () => Promise.resolve(), canShare: () => true });
    expect(canShare(data)).toBe(true);

    installNavigator({ share: () => Promise.resolve(), canShare: () => false });
    expect(canShare(data)).toBe(false);
  });

  it('hands navigator.canShare a mutable, defined-keys-only payload', () => {
    const seen: unknown[] = [];
    installNavigator({
      share: () => Promise.resolve(),
      canShare: (data: unknown) => {
        seen.push(data);
        return true;
      },
    });

    canShare({ url: 'https://example.com', files: [testFile()] });
    expect(seen).toHaveLength(1);
    expect(Object.keys(seen[0] as object).sort()).toEqual(['files', 'url']);
  });

  it('returns false for a files payload when navigator.canShare is missing', () => {
    installNavigator({ share: () => Promise.resolve() });
    expect(canShare({ files: [testFile()] })).toBe(false);
  });

  it('returns false rather than throwing when navigator.canShare throws', () => {
    installNavigator({
      share: () => Promise.resolve(),
      canShare: () => {
        throw new Error('partial implementation');
      },
    });
    expect(() => canShare({ files: [testFile()] })).not.toThrow();
    expect(canShare({ files: [testFile()] })).toBe(false);
  });
});

describe('share', () => {
  it('resolves shared when the native sheet completes', async () => {
    const stub = recordingShare();
    installNavigator({ share: stub.share });

    await expect(share({ title: 'T', text: 'B', url: 'https://example.com' })).resolves.toEqual({
      status: 'shared',
    });
    expect(stub.calls).toEqual([{ title: 'T', text: 'B', url: 'https://example.com' }]);
  });

  it('forwards only the members the caller set', async () => {
    const stub = recordingShare();
    installNavigator({ share: stub.share });

    await share({ url: 'https://example.com' });
    expect(Object.keys(stub.calls[0] as object)).toEqual(['url']);
  });

  it('resolves dismissed on an AbortError — never reported as a failure', async () => {
    const onError = vi.fn();
    installNavigator({ share: () => Promise.reject(abortError()) });

    const result = await share({ url: 'https://example.com' }, { onError });

    expect(result).toEqual({ status: 'dismissed' });
    expect(result.status).not.toBe('failed');
    expect(onError).not.toHaveBeenCalled();
  });

  it('resolves unsupported when there is no Web Share API', async () => {
    const onError = vi.fn();
    installNavigator({});

    await expect(share({ url: 'https://example.com' }, { onError })).resolves.toEqual({ status: 'unsupported' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('resolves failed on a generic rejection, reporting the normalized error', async () => {
    const onError = vi.fn();
    const boom = new Error('boom');
    installNavigator({ share: () => Promise.reject(boom) });

    const result = await share({ url: 'https://example.com' }, { onError });

    expect(result.status).toBe('failed');
    expect(result).toEqual({ status: 'failed', error: boom });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it('normalizes a non-Error rejection into an Error', async () => {
    installNavigator({ share: () => Promise.reject('nope') });

    const result = await share({ url: 'https://example.com' });

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('nope');
  });

  it('resolves failed rather than rejecting when navigator.share throws synchronously', async () => {
    installNavigator({
      share: () => {
        throw new Error('sync throw');
      },
    });

    const result = await share({ url: 'https://example.com' });
    expect(result.status).toBe('failed');
  });

  it('absorbs a throw from the consumer onError callback', async () => {
    const onError = vi.fn(() => {
      throw new Error('reporter exploded');
    });
    installNavigator({ share: () => Promise.reject(new Error('boom')) });

    const result = await share({ url: 'https://example.com' }, { onError });

    expect(result.status).toBe('failed');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('never rejects under SSR', async () => {
    removeNavigator();
    await expect(share({ url: 'https://example.com' })).resolves.toEqual({ status: 'unsupported' });
  });
});

describe('shareOrCopy — clipboard fallback', () => {
  it('copies the url when Web Share is unsupported', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await expect(shareOrCopy({ title: 'T', url: 'https://example.com' })).resolves.toEqual({ status: 'copied' });
    expect(clip.writes).toEqual(['https://example.com']);
  });

  it('prefers url, then text, then title', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await shareOrCopy({ title: 'T', text: 'B', url: 'https://example.com' });
    await shareOrCopy({ title: 'T', text: 'B' });
    await shareOrCopy({ title: 'T' });

    expect(clip.writes).toEqual(['https://example.com', 'B', 'T']);
  });

  it('does NOT copy when the user dismissed the sheet', async () => {
    const clip = recordingClipboard();
    installNavigator({ share: () => Promise.reject(abortError()), clipboard: clip.clipboard });

    await expect(shareOrCopy({ url: 'https://example.com' })).resolves.toEqual({ status: 'dismissed' });
    expect(clip.writes).toEqual([]);
  });

  it('does NOT copy when the share failed', async () => {
    const clip = recordingClipboard();
    installNavigator({ share: () => Promise.reject(new Error('boom')), clipboard: clip.clipboard });

    const result = await shareOrCopy({ url: 'https://example.com' });

    expect(result.status).toBe('failed');
    expect(clip.writes).toEqual([]);
  });

  it('does NOT copy when the native sheet completed', async () => {
    const clip = recordingClipboard();
    installNavigator({ share: () => Promise.resolve(), clipboard: clip.clipboard });

    await expect(shareOrCopy({ url: 'https://example.com' })).resolves.toEqual({ status: 'shared' });
    expect(clip.writes).toEqual([]);
  });

  it('opts out of the fallback with fallbackToCopy: false', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await expect(shareOrCopy({ url: 'https://example.com' }, { fallbackToCopy: false })).resolves.toEqual({
      status: 'unsupported',
    });
    expect(clip.writes).toEqual([]);
  });

  it('stays unsupported when the payload has no copyable text', async () => {
    const clip = recordingClipboard();
    installNavigator({ clipboard: clip.clipboard });

    await expect(shareOrCopy({ files: [testFile()] })).resolves.toEqual({ status: 'unsupported' });
    expect(clip.writes).toEqual([]);
  });

  it('stays unsupported when the clipboard is unavailable too', async () => {
    installNavigator({});
    await expect(shareOrCopy({ url: 'https://example.com' })).resolves.toEqual({ status: 'unsupported' });
  });

  it('reports a rejected clipboard write as failed', async () => {
    const onError = vi.fn();
    const clip = recordingClipboard('reject');
    installNavigator({ clipboard: clip.clipboard });

    const result = await shareOrCopy({ url: 'https://example.com' }, { onError });

    expect(result.status).toBe('failed');
    expect(clip.writes).toEqual(['https://example.com']);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('never rejects under SSR', async () => {
    removeNavigator();
    await expect(shareOrCopy({ url: 'https://example.com' })).resolves.toEqual({ status: 'unsupported' });
  });
});

describe('shareFallbackText', () => {
  it('prefers url, then text, then title', () => {
    expect(shareFallbackText({ title: 'T', text: 'B', url: 'U' })).toBe('U');
    expect(shareFallbackText({ title: 'T', text: 'B' })).toBe('B');
    expect(shareFallbackText({ title: 'T' })).toBe('T');
  });

  it('skips blank and whitespace-only members', () => {
    expect(shareFallbackText({ title: 'T', text: '', url: '   ' })).toBe('T');
  });

  it('returns undefined when nothing is copyable', () => {
    expect(shareFallbackText({})).toBeUndefined();
    expect(shareFallbackText({ files: [testFile()] })).toBeUndefined();
  });
});
