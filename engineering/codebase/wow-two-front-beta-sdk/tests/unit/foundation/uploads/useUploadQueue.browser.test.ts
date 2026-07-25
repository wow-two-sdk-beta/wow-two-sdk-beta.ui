import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  UploadStatus,
  createUploadQueue,
  useUploadQueue,
  useUploadQueueSnapshot,
  type UploadTransport,
  type UploadTransportContext,
} from '@src/foundation/uploads';

// Browser project — the queue's own scheduling is covered in `uploads.test.ts` (node). This file only covers what
// a renderer adds: that a mutation inside the store actually re-renders the subscriber, that the queue survives
// re-renders instead of being rebuilt (which would strand in-flight uploads), and that the transport delegation
// keeps an inline closure live.
//
// The transport parks every call, so each assertion happens at a point the test chose. Store mutations arriving
// from outside React (a transport promise settling) are wrapped in `act` so the re-render is flushed before the
// assertion reads `result.current`.

/** One parked transport call plus the handles to settle it. */
interface PendingUpload {
  readonly file: File;
  readonly resolve: (value: string) => void;
  readonly reject: (error: unknown) => void;
  readonly progress: UploadTransportContext['onProgress'];
}

/** A transport whose every call parks until the test settles it. */
function createManualTransport(): { transport: UploadTransport<string>; calls: PendingUpload[] } {
  const calls: PendingUpload[] = [];
  const transport: UploadTransport<string> = {
    upload(file, { onProgress }) {
      return new Promise<string>((resolve, reject) => {
        calls.push({ file, resolve, reject, progress: onProgress });
      });
    },
  };
  return { transport, calls };
}

function makeFile(name = 'a.txt', size = 100): File {
  return new File([new Uint8Array(size)], name, { type: 'text/plain' });
}

/** Lets parked promises and their re-renders land. */
async function settle(): Promise<void> {
  await act(async () => {
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
  });
}

describe('useUploadQueue', () => {
  it('starts with no items and an idle aggregate', () => {
    const { transport } = createManualTransport();
    const { result } = renderHook(() => useUploadQueue({ transport }));

    expect(result.current.items).toEqual([]);
    expect(result.current.state.total).toBe(0);
    expect(result.current.state.isUploading).toBe(false);
  });

  it('re-renders as an upload moves through its statuses', async () => {
    const { transport, calls } = createManualTransport();
    const { result } = renderHook(() => useUploadQueue({ transport }));

    act(() => {
      result.current.add(makeFile('report.pdf'));
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.status).toBe(UploadStatus.Uploading);
    expect(result.current.state.isUploading).toBe(true);

    await act(async () => {
      calls[0]?.progress(50);
      await Promise.resolve();
    });
    expect(result.current.items[0]?.progress).toBe(0.5);
    expect(result.current.state.progress).toBe(0.5);

    await act(async () => {
      calls[0]?.resolve('stored');
      await Promise.resolve();
    });
    expect(result.current.items[0]?.status).toBe(UploadStatus.Succeeded);
    expect(result.current.items[0]?.result).toBe('stored');
    expect(result.current.state.isUploading).toBe(false);
  });

  it('exposes the queue actions, including cancelAll and clear', async () => {
    const { transport, calls } = createManualTransport();
    const { result } = renderHook(() => useUploadQueue({ transport, concurrency: 2 }));

    act(() => {
      result.current.add([makeFile('a.txt'), makeFile('b.txt')]);
    });
    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.cancelAll();
    });
    for (const call of calls) call.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await settle();

    expect(result.current.items.every((item) => item.status === UploadStatus.Cancelled)).toBe(true);

    act(() => {
      result.current.clear();
    });
    expect(result.current.items).toEqual([]);
  });

  it('keeps one queue across re-renders so in-flight uploads are never stranded', async () => {
    const { transport } = createManualTransport();
    const { result, rerender } = renderHook(() => useUploadQueue({ transport }));

    const first = result.current.queue;
    act(() => {
      result.current.add(makeFile('a.txt'));
    });

    rerender();

    expect(result.current.queue).toBe(first);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.status).toBe(UploadStatus.Uploading);
  });

  it('delegates to the latest render’s transport rather than the one captured at mount', () => {
    const first = createManualTransport();
    const second = createManualTransport();
    const { result, rerender } = renderHook((props: { transport: UploadTransport<string> }) => useUploadQueue(props), {
      initialProps: { transport: first.transport },
    });

    rerender({ transport: second.transport });
    act(() => {
      result.current.add(makeFile('a.txt'));
    });

    expect(first.calls).toHaveLength(0);
    expect(second.calls).toHaveLength(1);
  });
});

describe('useUploadQueueSnapshot', () => {
  it('subscribes to a queue the caller owns, so uploads outlive the component', async () => {
    const { transport, calls } = createManualTransport();
    // Created outside React — the module-scope / provider-owned case.
    const queue = createUploadQueue({ transport });
    const { result, unmount } = renderHook(() => useUploadQueueSnapshot(queue));

    act(() => {
      queue.add(makeFile('a.txt'));
    });
    expect(result.current.items).toHaveLength(1);

    unmount();

    // The queue keeps running with no subscriber; a later mount would see the finished state.
    calls[0]?.resolve('stored');
    for (let index = 0; index < 10; index += 1) await Promise.resolve();
    expect(queue.get(queue.items()[0]!.id)?.status).toBe(UploadStatus.Succeeded);
  });
});
