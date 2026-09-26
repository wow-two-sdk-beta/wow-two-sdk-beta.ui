import { describe, expect, it, vi } from 'vitest';
import { LatestRevisionQueue } from '@src/foundation/sync/LatestRevisionQueue';

describe('LatestRevisionQueue', () => {
  it('collapses writes queued in flight to the latest snapshot', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = vi.fn(async (value: { revision: number; value: string }) => {
      if (value.value === 'a') await gate;
      return { ...value, revision: value.revision + 1 };
    });
    const statuses: string[] = [];
    const queue = new LatestRevisionQueue({
      initialRevision: 3,
      write,
      onStatus: (status) => statuses.push(status),
    });
    queue.push({ revision: 0, value: 'a' });
    queue.push({ revision: 0, value: 'b' });
    queue.push({ revision: 0, value: 'c' });
    release();
    await vi.waitFor(() => expect(statuses.at(-1)).toBe('synced'));
    expect(write.mock.calls.map(([value]) => value)).toEqual([
      { revision: 3, value: 'a' },
      { revision: 4, value: 'c' },
    ]);
  });
});
