import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canCaptureMedia,
  facingModeConstraints,
  getMediaSupport,
  hasCamera,
  hasMicrophone,
  listMediaDevices,
  requestCameraStream,
  requestMediaStream,
  requestMicrophoneStream,
  stopMediaStream,
  switchCamera,
  type MediaStreamStatus,
} from '@src/foundation/media';

// Node project — the whole non-React surface is capability detection, promise plumbing, and a `DOMException`-name
// table, so fake globals are all it needs; no DOM, no renderer. Node ships a real `globalThis.navigator` with no
// `mediaDevices` (which is exactly the SSR / insecure-page shape) and no `isSecureContext` at all, so each test
// installs only what its case needs and `afterEach` puts both globals back — a leaked stub would silently turn
// the SSR assertions green. `useMediaStream` needs a renderer and lives in `media.browser.test.ts`.

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalSecureContext = Object.getOwnPropertyDescriptor(globalThis, 'isSecureContext');

/** Replaces the `navigator` global wholesale — Node's is an accessor, so shadowing a single member is not enough. */
function installNavigator(value: unknown): void {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}

/** Removes `navigator` entirely — the SSR shape. */
function removeNavigator(): void {
  delete (globalThis as { navigator?: unknown }).navigator;
}

/** Installs a `navigator.mediaDevices` carrying exactly the members a test wants. */
function installMediaDevices(mediaDevices: unknown): void {
  installNavigator({ mediaDevices });
}

/** Sets the `isSecureContext` global. Node has none, which is itself a case under test. */
function setSecureContext(value: boolean): void {
  Object.defineProperty(globalThis, 'isSecureContext', { value, configurable: true, writable: true });
}

/** A track whose `stop` is observable, and which can refuse to stop or record its ordering. */
function fakeTrack(behaviour?: { throws?: boolean; onStop?: () => void }): {
  track: MediaStreamTrack;
  stop: ReturnType<typeof vi.fn>;
} {
  const stop = vi.fn((): void => {
    behaviour?.onStop?.();
    if (behaviour?.throws === true) throw new Error('track refused to stop');
  });
  return { track: { stop } as unknown as MediaStreamTrack, stop };
}

/** A stream that is nothing but its track list — enough for every path this slice takes through one. */
function fakeStream(tracks: readonly MediaStreamTrack[]): MediaStream {
  return { getTracks: (): MediaStreamTrack[] => [...tracks] } as unknown as MediaStream;
}

/** Installs a `getUserMedia` stub and records the constraints every call receives. */
function installGetUserMedia(implementation: () => Promise<unknown> | unknown): { calls: MediaStreamConstraints[] } {
  const calls: MediaStreamConstraints[] = [];
  installMediaDevices({
    getUserMedia: (constraints: MediaStreamConstraints): Promise<unknown> | unknown => {
      calls.push(constraints);
      return implementation();
    },
  });
  return { calls };
}

/** Installs an `enumerateDevices` stub. Deliberately without `getUserMedia` — the two members fail independently. */
function installEnumerateDevices(implementation: () => Promise<unknown> | unknown): void {
  installMediaDevices({ enumerateDevices: implementation });
}

/** Builds an object whose named member throws on read — the partial-polyfill / hostile-proxy shape. */
function withThrowingGetter(key: string): object {
  return Object.defineProperty(
    {},
    key,
    {
      get() {
        throw new Error(`${key} getter exploded`);
      },
      configurable: true,
    },
  );
}

afterEach(() => {
  // Both globals restored, not merely deleted: a leaked fake `navigator` would make the SSR cases pass for the
  // wrong reason, and a leaked `isSecureContext` would turn every `unsupported` into `insecure-context`.
  delete (globalThis as { navigator?: unknown }).navigator;
  if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);

  delete (globalThis as { isSecureContext?: unknown }).isSecureContext;
  if (originalSecureContext !== undefined) Object.defineProperty(globalThis, 'isSecureContext', originalSecureContext);
});

describe('getMediaSupport / canCaptureMedia — absent API', () => {
  it('reports unsupported under SSR, with no navigator at all', () => {
    removeNavigator();

    expect(typeof navigator).toBe('undefined');
    expect(getMediaSupport()).toBe('unsupported');
    expect(canCaptureMedia()).toBe(false);
  });

  it('reports unsupported when navigator carries no mediaDevices', () => {
    installNavigator({});

    expect(getMediaSupport()).toBe('unsupported');
  });

  it('reports unsupported when mediaDevices lacks getUserMedia', () => {
    installMediaDevices({ enumerateDevices: () => Promise.resolve([]) });

    expect(getMediaSupport()).toBe('unsupported');
  });

  it('reads a throwing mediaDevices getter as absent rather than propagating', () => {
    installNavigator(withThrowingGetter('mediaDevices'));

    expect(() => getMediaSupport()).not.toThrow();
    expect(getMediaSupport()).toBe('unsupported');
  });

  it('reports supported once getUserMedia is callable', () => {
    installGetUserMedia(() => Promise.resolve(fakeStream([])));

    expect(getMediaSupport()).toBe('supported');
    expect(canCaptureMedia()).toBe(true);
  });
});

describe('getMediaSupport — the insecure-context reason', () => {
  it('names the insecure context when the API is absent and the page is known non-secure', () => {
    removeNavigator();
    setSecureContext(false);

    expect(getMediaSupport()).toBe('insecure-context');
    expect(canCaptureMedia()).toBe(false);
  });

  it('does not blame the context when the flag is simply missing (Node / SSR)', () => {
    removeNavigator();

    expect(getMediaSupport()).toBe('unsupported');
  });

  it('does not blame the context when the page is secure', () => {
    installNavigator({});
    setSecureContext(true);

    expect(getMediaSupport()).toBe('unsupported');
  });

  it('lets a present getUserMedia outrank the insecure flag', () => {
    installGetUserMedia(() => Promise.resolve(fakeStream([])));
    setSecureContext(false);

    expect(getMediaSupport()).toBe('supported');
  });

  it('still answers unsupported (never throws) when a request is made on an insecure page', async () => {
    removeNavigator();
    setSecureContext(false);

    await expect(requestCameraStream()).resolves.toEqual({ status: 'unsupported' });
    await expect(requestMicrophoneStream()).resolves.toEqual({ status: 'unsupported' });
    await expect(requestMediaStream({ video: true })).resolves.toEqual({ status: 'unsupported' });
  });
});

describe('requestMediaStream — DOMException name → status', () => {
  // The table this slice exists for. Legacy names included: they are what older Chrome / Firefox actually throw,
  // and omitting them downgrades a denial to a generic failure on exactly those engines.
  const RejectionTable: [string, MediaStreamStatus][] = [
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['NotFoundError', 'unavailable'],
    ['DevicesNotFoundError', 'unavailable'],
    ['NotReadableError', 'in-use'],
    ['TrackStartError', 'in-use'],
    // Deliberately NOT mapped — a caller-side constraints bug, an OS interruption, a policy block. See
    // `MediaStreamResult.ts` for why each stays a `failed` carrying the real error.
    ['OverconstrainedError', 'failed'],
    ['AbortError', 'failed'],
    ['SecurityError', 'failed'],
    ['TypeError', 'failed'],
  ];

  it.each(RejectionTable)('maps a %s rejection to %s', async (name, status) => {
    installGetUserMedia(() => Promise.reject(new DOMException('rejected', name)));

    await expect(requestCameraStream()).resolves.toMatchObject({ status });
  });

  it('keys on name rather than instanceof — a plain { name } double maps too', async () => {
    installGetUserMedia(() => Promise.reject({ name: 'NotAllowedError' }));

    await expect(requestCameraStream()).resolves.toEqual({ status: 'denied' });
  });

  it('normalizes a non-error rejection into failed carrying a real Error', async () => {
    installGetUserMedia(() => Promise.reject('device exploded'));

    const result = await requestCameraStream();

    if (result.status !== 'failed') throw new Error(`expected failed, got ${result.status}`);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('device exploded');
  });

  it('catches a synchronous throw — getUserMedia throws before any promise for empty constraints', async () => {
    installGetUserMedia(() => {
      throw new DOMException('at least one of audio and video must be requested', 'TypeError');
    });

    await expect(requestMediaStream({})).resolves.toMatchObject({ status: 'failed' });
  });

  it('survives a rejection whose name getter throws', async () => {
    installGetUserMedia(() => Promise.reject(withThrowingGetter('name')));

    await expect(requestCameraStream()).resolves.toMatchObject({ status: 'failed' });
  });
});

describe('requestMediaStream — grant and constraint shaping', () => {
  it('hands back the live stream by identity on grant', async () => {
    const stream = fakeStream([]);
    installGetUserMedia(() => Promise.resolve(stream));

    const result = await requestCameraStream();

    if (result.status !== 'granted') throw new Error(`expected granted, got ${result.status}`);
    expect(result.stream).toBe(stream);
  });

  it('requests video only for a camera — never opening the microphone unasked', async () => {
    const stub = installGetUserMedia(() => Promise.resolve(fakeStream([])));

    await requestCameraStream();

    expect(stub.calls).toEqual([{ video: true }]);
  });

  it('nests camera track constraints under video', async () => {
    const stub = installGetUserMedia(() => Promise.resolve(fakeStream([])));

    await requestCameraStream({ width: 640 });

    expect(stub.calls).toEqual([{ video: { width: 640 } }]);
  });

  it('requests audio only for a microphone', async () => {
    const stub = installGetUserMedia(() => Promise.resolve(fakeStream([])));

    await requestMicrophoneStream({ echoCancellation: true });

    expect(stub.calls).toEqual([{ audio: { echoCancellation: true } }]);
  });

  it('refuses an off-spec resolve rather than handing back a non-stream', async () => {
    installGetUserMedia(() => Promise.resolve(null));

    await expect(requestCameraStream()).resolves.toMatchObject({ status: 'failed' });
  });
});

describe('listMediaDevices', () => {
  it('groups entries by kind, preserving order within a group', async () => {
    installEnumerateDevices(() =>
      Promise.resolve([
        { kind: 'videoinput', deviceId: 'cam-1', label: '' },
        { kind: 'audioinput', deviceId: 'mic-1', label: '' },
        { kind: 'audiooutput', deviceId: 'spk-1', label: '' },
        { kind: 'videoinput', deviceId: 'cam-2', label: '' },
      ]),
    );

    const groups = await listMediaDevices();

    expect(groups.supported).toBe(true);
    expect(groups.cameras.map((device) => device.deviceId)).toEqual(['cam-1', 'cam-2']);
    expect(groups.microphones.map((device) => device.deviceId)).toEqual(['mic-1']);
    expect(groups.speakers.map((device) => device.deviceId)).toEqual(['spk-1']);
  });

  it('passes through the empty labels a pre-permission enumeration returns', async () => {
    // The documented gotcha: counts are honest before permission, labels are blank. A picker built on this
    // renders blank rows — which is why `hasCamera` is the pre-permission API and the picker comes after.
    installEnumerateDevices(() =>
      Promise.resolve([
        { kind: 'videoinput', deviceId: '', label: '' },
        { kind: 'audioinput', deviceId: '', label: '' },
      ]),
    );

    const groups = await listMediaDevices();

    expect(groups.cameras).toHaveLength(1);
    expect(groups.cameras.every((device) => device.label === '')).toBe(true);
    expect(groups.microphones.every((device) => device.label === '')).toBe(true);
  });

  it('drops entries with an unknown, absent, or unreadable kind', async () => {
    installEnumerateDevices(() =>
      Promise.resolve([{ kind: 'videoinput' }, { kind: 'wat' }, {}, null, 42, 'nope', withThrowingGetter('kind')]),
    );

    const groups = await listMediaDevices();

    expect(groups.cameras).toHaveLength(1);
    expect(groups.microphones).toHaveLength(0);
    expect(groups.speakers).toHaveLength(0);
  });

  it('reports supported false when the API is absent', async () => {
    removeNavigator();

    await expect(listMediaDevices()).resolves.toEqual({
      supported: false,
      cameras: [],
      microphones: [],
      speakers: [],
    });
  });

  it('keeps supported true when the call itself rejects — the API was there, the answer was not', async () => {
    installEnumerateDevices(() => Promise.reject(new DOMException('blocked by policy', 'NotAllowedError')));

    await expect(listMediaDevices()).resolves.toEqual({
      supported: true,
      cameras: [],
      microphones: [],
      speakers: [],
    });
  });

  it('handles an off-spec non-array resolve', async () => {
    installEnumerateDevices(() => Promise.resolve('not an array'));

    await expect(listMediaDevices()).resolves.toMatchObject({ supported: true, cameras: [] });
  });
});

describe('hasCamera / hasMicrophone', () => {
  it('answer true from counts alone, before any permission is granted', async () => {
    installEnumerateDevices(() =>
      Promise.resolve([
        { kind: 'videoinput', label: '' },
        { kind: 'audioinput', label: '' },
      ]),
    );

    await expect(hasCamera()).resolves.toBe(true);
    await expect(hasMicrophone()).resolves.toBe(true);
  });

  it('answer false for a machine with neither', async () => {
    installEnumerateDevices(() => Promise.resolve([{ kind: 'audiooutput', label: '' }]));

    await expect(hasCamera()).resolves.toBe(false);
    await expect(hasMicrophone()).resolves.toBe(false);
  });

  it('answer false under SSR without throwing', async () => {
    removeNavigator();

    await expect(hasCamera()).resolves.toBe(false);
    await expect(hasMicrophone()).resolves.toBe(false);
  });
});

describe('stopMediaStream', () => {
  it('stops EVERY track — a stream has no stop() of its own', () => {
    const camera = fakeTrack();
    const microphone = fakeTrack();
    const third = fakeTrack();

    stopMediaStream(fakeStream([camera.track, microphone.track, third.track]));

    expect(camera.stop).toHaveBeenCalledTimes(1);
    expect(microphone.stop).toHaveBeenCalledTimes(1);
    expect(third.stop).toHaveBeenCalledTimes(1);
  });

  it('reaches the later tracks when an earlier one refuses to stop', () => {
    const refusing = fakeTrack({ throws: true });
    const after = fakeTrack();

    expect(() => stopMediaStream(fakeStream([refusing.track, after.track]))).not.toThrow();

    expect(refusing.stop).toHaveBeenCalledTimes(1);
    expect(after.stop).toHaveBeenCalledTimes(1);
  });

  it('is idempotent — a second call stops the same tracks again without throwing', () => {
    const track = fakeTrack();
    const stream = fakeStream([track.track]);

    stopMediaStream(stream);
    stopMediaStream(stream);

    expect(track.stop).toHaveBeenCalledTimes(2);
  });

  it('is a no-op for null, undefined, and things that are not streams', () => {
    expect(() => stopMediaStream(null)).not.toThrow();
    expect(() => stopMediaStream(undefined)).not.toThrow();
    expect(() => stopMediaStream({} as MediaStream)).not.toThrow();
    expect(() => stopMediaStream({ getTracks: () => 'nope' } as unknown as MediaStream)).not.toThrow();
    expect(() => stopMediaStream(withThrowingGetter('getTracks') as MediaStream)).not.toThrow();
  });
});

describe('facingModeConstraints', () => {
  it('prefers rather than demands by default — exact rejects on every single-camera device', () => {
    expect(facingModeConstraints('environment')).toEqual({ facingMode: { ideal: 'environment' } });
  });

  it('demands when explicitly asked', () => {
    expect(facingModeConstraints('user', { exact: true })).toEqual({ facingMode: { exact: 'user' } });
  });

  it('merges extra video constraints and wins on facingMode', () => {
    expect(facingModeConstraints('user', { video: { width: 1280, facingMode: 'environment' } })).toEqual({
      width: 1280,
      facingMode: { ideal: 'user' },
    });
  });
});

describe('switchCamera', () => {
  it('stops the old stream BEFORE acquiring the new one', async () => {
    const order: string[] = [];
    const old = fakeTrack({ onStop: () => order.push('stop') });
    installGetUserMedia(() => {
      order.push('getUserMedia');
      return Promise.resolve(fakeStream([]));
    });

    await switchCamera(fakeStream([old.track]), 'environment');

    expect(order).toEqual(['stop', 'getUserMedia']);
  });

  it('requests the new facing mode as a camera-only stream', async () => {
    const stub = installGetUserMedia(() => Promise.resolve(fakeStream([])));

    await switchCamera(null, 'environment');

    expect(stub.calls).toEqual([{ video: { facingMode: { ideal: 'environment' } } }]);
  });

  it('still releases the old stream when the new acquisition is denied', async () => {
    const old = fakeTrack();
    installGetUserMedia(() => Promise.reject(new DOMException('blocked', 'NotAllowedError')));

    const result = await switchCamera(fakeStream([old.track]), 'user');

    expect(result).toEqual({ status: 'denied' });
    expect(old.stop).toHaveBeenCalledTimes(1);
  });
});

describe('hostile inputs — the never-throws contract', () => {
  const HostileInputs: readonly unknown[] = [
    undefined,
    null,
    0,
    '',
    Symbol('hostile'),
    () => undefined,
    Object.create(null),
    { toString: () => { throw new Error('toString exploded'); } },
  ];

  it('classifies any rejection value without throwing', async () => {
    const statuses: MediaStreamStatus[] = ['denied', 'unavailable', 'in-use', 'unsupported', 'failed'];

    for (const input of HostileInputs) {
      installGetUserMedia(() => Promise.reject(input));

      const result = await requestCameraStream();
      expect(statuses).toContain(result.status);
    }
  });

  it('accepts any value as a stream to stop without throwing', () => {
    for (const input of HostileInputs) {
      expect(() => stopMediaStream(input as MediaStream)).not.toThrow();
    }
  });

  it('accepts any value as enumerated devices without throwing', async () => {
    for (const input of HostileInputs) {
      installEnumerateDevices(() => Promise.resolve(input));

      await expect(listMediaDevices()).resolves.toMatchObject({ supported: true });
    }
  });

  it('accepts any value as constraints without throwing', async () => {
    installGetUserMedia(() => Promise.resolve(fakeStream([])));

    for (const input of HostileInputs) {
      await expect(requestMediaStream(input as MediaStreamConstraints)).resolves.toMatchObject({
        status: 'granted',
      });
    }
  });
});
