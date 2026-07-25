// Device inventory — `enumerateDevices` regrouped into the three buckets a UI actually renders (a camera picker,
// a microphone picker, an output picker), instead of one flat array every consumer re-filters by a `kind` string.
//
// THE LABEL GOTCHA, and the reason this module documents more than it computes: before capture permission is
// granted, browsers return the devices with `label: ''` and (in most engines) an empty `deviceId`. The privacy
// reason is sound — "Logitech BRIO" plus "Yeti Nano" is a fingerprint — but the consequence catches everyone:
// a device picker built on a cold `enumerateDevices()` renders a list of blank rows. The sequence that works is
// request a stream first, THEN enumerate, and the labels are populated. Counts are honest either way, which is
// what makes `hasCamera` / `hasMicrophone` usable *before* prompting.
//
// Reported as a total shape rather than a discriminated result: every arm of this call is "here are the devices
// I could see", and zero cameras behaves identically whether the API was missing or the machine has none. The
// `supported` flag preserves the distinction for the one caller that needs it — a picker that wants to say "this
// browser cannot list devices" rather than "no cameras found".
//
// Never throws. `enumerateDevices` can reject (a permissions policy blocking the feature) and can, on a partial
// implementation, resolve with something other than an array; both land on empty groups.

import { mediaDevicesWith } from './CanCaptureMedia';

/**
 * Media input / output devices, grouped by kind.
 *
 * Labels are empty strings until capture permission has been granted at least once in this origin — see the
 * module header. Group membership and counts are accurate regardless.
 */
export interface MediaDeviceGroups {
  /** Whether `enumerateDevices` was reachable at all. `false` means every group is empty because the API is absent (SSR, older browser), not because the machine has no devices. */
  readonly supported: boolean;

  /** Video inputs — `kind === 'videoinput'`. Webcams, virtual cameras, capture cards. */
  readonly cameras: readonly MediaDeviceInfo[];

  /** Audio inputs — `kind === 'audioinput'`. Microphones, line-ins, virtual audio devices. */
  readonly microphones: readonly MediaDeviceInfo[];

  /** Audio outputs — `kind === 'audiooutput'`. Speakers and headsets. Absent entirely on Firefox, which does not enumerate outputs. */
  readonly speakers: readonly MediaDeviceInfo[];
}

/** Builds the empty answer for a given support verdict — the shape both the absent-API and failed-call paths return. */
function emptyGroups(supported: boolean): MediaDeviceGroups {
  return { supported, cameras: [], microphones: [], speakers: [] };
}

/** Reads an enumerated entry's `kind`. Guarded, so one hostile entry cannot abort the whole grouping pass. */
function kindOf(entry: unknown): string | undefined {
  if (entry === null || typeof entry !== 'object') return undefined;

  try {
    const kind: unknown = (entry as Record<string, unknown>)['kind'];
    return typeof kind === 'string' ? kind : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Lists the available media devices, grouped by kind.
 *
 * Call it AFTER a successful `requestCameraStream` / `requestMicrophoneStream` if the labels matter — a picker
 * built on a pre-permission call renders blank rows (module header). Entries with an unrecognized `kind` are
 * dropped rather than guessed at.
 *
 * Never throws, never rejects.
 *
 * @returns The grouped devices, with `supported: false` when the API is absent.
 */
export async function listMediaDevices(): Promise<MediaDeviceGroups> {
  const devices = mediaDevicesWith('enumerateDevices');
  if (devices === undefined) return emptyGroups(false);

  try {
    const entries: unknown = await devices.enumerateDevices();
    if (!Array.isArray(entries)) return emptyGroups(true);

    const cameras: MediaDeviceInfo[] = [];
    const microphones: MediaDeviceInfo[] = [];
    const speakers: MediaDeviceInfo[] = [];

    for (const entry of entries as readonly unknown[]) {
      switch (kindOf(entry)) {
        case 'videoinput':
          cameras.push(entry as MediaDeviceInfo);
          break;
        case 'audioinput':
          microphones.push(entry as MediaDeviceInfo);
          break;
        case 'audiooutput':
          speakers.push(entry as MediaDeviceInfo);
          break;
        default:
          // An unknown or unreadable `kind`. Dropped: a device in the wrong picker is worse than a missing one.
          break;
      }
    }

    return { supported: true, cameras, microphones, speakers };
  } catch {
    // The API was there but refused to answer — a permissions policy, or a partial implementation. `supported`
    // stays true because the absence here is of an *answer*, not of the API.
    return emptyGroups(true);
  }
}

/**
 * Reports whether this machine has at least one camera.
 *
 * Usable BEFORE prompting: counts are accurate without permission even though labels are not, which makes this
 * the right gate for showing or hiding a "Take a photo" affordance. Never throws; `false` under SSR.
 */
export async function hasCamera(): Promise<boolean> {
  return (await listMediaDevices()).cameras.length > 0;
}

/**
 * Reports whether this machine has at least one microphone.
 *
 * Same pre-permission caveat as {@link hasCamera}. Never throws; `false` under SSR.
 */
export async function hasMicrophone(): Promise<boolean> {
  return (await listMediaDevices()).microphones.length > 0;
}
