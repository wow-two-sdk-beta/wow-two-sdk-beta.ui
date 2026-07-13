import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { composeRefs } from '@src/foundation/utils/composeRefs/composeRefs';

interface NodeStub {
  id: string;
}

const node: NodeStub = { id: 'node' };

const refMock = () => vi.fn<(value: NodeStub | null) => void>();

describe('composeRefs — attach', () => {
  it('passes the node to function refs', () => {
    const fnRef = refMock();
    composeRefs<NodeStub>(fnRef)(node);
    expect(fnRef).toHaveBeenCalledTimes(1);
    expect(fnRef).toHaveBeenCalledWith(node);
  });

  it('assigns the node to object refs', () => {
    const objRef = createRef<NodeStub>();
    composeRefs(objRef)(node);
    expect(objRef.current).toBe(node);
  });

  it('feeds every ref the same node, in argument order', () => {
    const seen: string[] = [];
    const first = (value: NodeStub | null): void => {
      seen.push(`first:${value?.id ?? 'null'}`);
    };
    const objRef = createRef<NodeStub>();
    const last = (value: NodeStub | null): void => {
      seen.push(`last:${value?.id ?? 'null'}`);
    };

    composeRefs(first, objRef, last)(node);

    expect(seen).toEqual(['first:node', 'last:node']);
    expect(objRef.current).toBe(node);
  });

  it('tolerates null and undefined entries', () => {
    const fnRef = refMock();
    expect(() => composeRefs<NodeStub>(undefined, null, fnRef)(node)).not.toThrow();
    expect(fnRef).toHaveBeenCalledWith(node);
  });
});

describe('composeRefs — detach without cleanups', () => {
  it('returns no cleanup when no inner ref provides one', () => {
    expect(composeRefs<NodeStub>(refMock(), createRef<NodeStub>())(node)).toBeUndefined();
  });

  it('detaches by calling again with null (pre-React-19 style)', () => {
    const fnRef = refMock();
    const objRef = createRef<NodeStub>();
    const composed = composeRefs(fnRef, objRef);

    composed(node);
    composed(null);

    expect(fnRef).toHaveBeenLastCalledWith(null);
    expect(objRef.current).toBeNull();
  });
});

describe('composeRefs — React 19 cleanups', () => {
  it('returns a composed cleanup when any inner ref returns one', () => {
    const cleanup = vi.fn();
    const withCleanup = vi.fn(() => cleanup);

    const dispose = composeRefs<NodeStub>(withCleanup)(node);
    if (typeof dispose !== 'function') throw new Error('expected a composed cleanup function');
    expect(cleanup).not.toHaveBeenCalled();

    dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
    // The cleanup-providing ref is never additionally null-called.
    expect(withCleanup).toHaveBeenCalledTimes(1);
    expect(withCleanup).toHaveBeenCalledWith(node);
  });

  it('mixed refs: cleanups run, the rest are null-detached', () => {
    const cleanup = vi.fn();
    const withCleanup = vi.fn(() => cleanup);
    const plainFn = refMock();
    const objRef = createRef<NodeStub>();

    const dispose = composeRefs<NodeStub>(withCleanup, plainFn, objRef)(node);
    expect(objRef.current).toBe(node);
    if (typeof dispose !== 'function') throw new Error('expected a composed cleanup function');

    dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(withCleanup).toHaveBeenCalledTimes(1); // attach only — cleanup covers its detach
    expect(plainFn).toHaveBeenCalledTimes(2); // attach with node, detach with null
    expect(plainFn).toHaveBeenLastCalledWith(null);
    expect(objRef.current).toBeNull();
  });

  it('runs every cleanup when several refs provide one', () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();

    const dispose = composeRefs<NodeStub>(
      () => cleanupA,
      () => cleanupB,
    )(node);
    if (typeof dispose !== 'function') throw new Error('expected a composed cleanup function');

    dispose();

    expect(cleanupA).toHaveBeenCalledTimes(1);
    expect(cleanupB).toHaveBeenCalledTimes(1);
  });
});
