// Release. The single most-forgotten call in camera code, and the reason this module exists at its own file:
// dropping the last reference to a `MediaStream` does NOT stop it. The tracks stay live, the camera indicator
// light stays on, the microphone keeps listening, and the device stays locked against every other application —
// until the tab is closed. Garbage collection is irrelevant; only `track.stop()` releases the hardware.
//
// Per-track, not per-stream: `MediaStream` has no `stop()`. A stream is a bag of tracks and each one holds its
// own device handle, so a camera+mic stream needs two stops. Stopping only the first is a partial release that
// looks correct (the light goes off) while the microphone is still recording.
//
// Each `stop()` gets its own `try`. One uncooperative track — an already-ended track from an engine that throws,
// a test double, a track from a detached document — must not strand the tracks after it in the loop. Skipping
// the rest is exactly the leak this function exists to prevent, so the loop always completes.

/**
 * Stops every track on a stream, releasing the underlying camera / microphone.
 *
 * Idempotent and total: a `null` / `undefined` stream, an already-stopped stream, and an object that is not a
 * stream at all are all no-ops. Never throws — it is called from cleanup paths (`finally`, an unmount effect)
 * where a throw would mask the original failure or abort the rest of the teardown.
 *
 * @param stream The stream to release. Nullable so a caller can pass state without a guard of its own.
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (stream === null || stream === undefined) return;

  let tracks: readonly MediaStreamTrack[] = [];
  try {
    const result: unknown = stream.getTracks();
    if (!Array.isArray(result)) return;
    tracks = result as readonly MediaStreamTrack[];
  } catch {
    // No usable `getTracks` — not a stream, or one from a torn-down realm. Nothing to release.
    return;
  }

  for (const track of tracks) {
    try {
      track.stop();
    } catch {
      // This track refused to stop. Swallowed on purpose: the remaining tracks still hold live devices, and
      // they are the ones this loop must reach.
    }
  }
}
