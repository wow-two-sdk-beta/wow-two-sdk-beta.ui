import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  downloadBlob,
  downloadJson,
  downloadText,
  readFileAsArrayBuffer,
  readFileAsDataUrl,
  readFileAsText,
} from '@src/foundation/files';

// Browser project — these need a real `FileReader`, `Blob`, `URL.createObjectURL`, and DOM. Download tests stub
// the object-URL pair and intercept the anchor click, so nothing actually hits the filesystem.

afterEach(async () => {
  // `downloadBlob` revokes on a `setTimeout(0)`. Drain it here — while this test's stubs are still installed —
  // so a pending revoke can't fire during the NEXT test and land in that test's captured array.
  await new Promise((resolve) => setTimeout(resolve, 0));
  vi.restoreAllMocks();
});

describe('readFile*', () => {
  it('reads a blob as text', async () => {
    await expect(readFileAsText(new Blob(['hello world']))).resolves.toBe('hello world');
  });

  it('reads a blob as a data URL', async () => {
    const url = await readFileAsDataUrl(new Blob(['hi'], { type: 'text/plain' }));
    expect(url.startsWith('data:text/plain;base64,')).toBe(true);
  });

  it('reads a blob as an ArrayBuffer', async () => {
    const buffer = await readFileAsArrayBuffer(new Blob(['abc']));
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array([97, 98, 99]));
  });

  it('rejects with an Error when the read fails', async () => {
    // Force `readAsText` to throw synchronously — the wrapper must convert it into a rejection, never a throw.
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(() => {
      throw new Error('boom');
    });
    await expect(readFileAsText(new Blob(['x']))).rejects.toThrow('boom');
  });
});

describe('download*', () => {
  /** Stubs the object-URL pair and captures the anchor click; returns the captured state. */
  function stubDownload() {
    const created: Blob[] = [];
    const revoked: string[] = [];
    // Snapshot the anchor's attributes at click time — the element itself is removed right after.
    let anchor: { download: string; href: string } | null = null;

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
      created.push(blob as Blob);
      return 'blob:stub-url';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url: string) => {
      revoked.push(url);
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      const element = document.querySelector('a[download]');
      if (element instanceof HTMLAnchorElement) anchor = { download: element.download, href: element.href };
    });

    return {
      created,
      revoked,
      get anchor() {
        return anchor;
      },
    };
  }

  it('clicks an anchor carrying the sanitized download name', () => {
    const stub = stubDownload();

    const dispatched = downloadBlob(new Blob(['data']), 'my/report:v1.txt');

    expect(dispatched).toBe(true);
    expect(stub.anchor?.download).toBe('my-report-v1.txt');
    expect(stub.anchor?.href).toContain('blob:stub-url');
    expect(stub.created).toHaveLength(1);
  });

  it('removes the anchor from the document after clicking', () => {
    stubDownload();
    downloadBlob(new Blob(['data']), 'a.txt');
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  });

  it('revokes the object URL on the next tick (no blob leak)', async () => {
    const stub = stubDownload();

    downloadBlob(new Blob(['data']), 'a.txt');
    expect(stub.revoked).toHaveLength(0); // not revoked synchronously — that can cancel the download

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stub.revoked).toEqual(['blob:stub-url']);
  });

  it('downloadText wraps the string with the given MIME type', async () => {
    const stub = stubDownload();

    downloadText('line', 'note.txt');

    expect(stub.created[0]?.type).toBe('text/plain;charset=utf-8');
    await expect(readFileAsText(stub.created[0] as Blob)).resolves.toBe('line');
  });

  it('downloadJson pretty-prints as application/json', async () => {
    const stub = stubDownload();

    downloadJson({ a: 1 }, 'data.json');

    expect(stub.created[0]?.type).toBe('application/json;charset=utf-8');
    await expect(readFileAsText(stub.created[0] as Blob)).resolves.toBe('{\n  "a": 1\n}');
  });
});
