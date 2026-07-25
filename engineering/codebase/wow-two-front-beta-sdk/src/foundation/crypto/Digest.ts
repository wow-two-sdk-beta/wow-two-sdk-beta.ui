// Cryptographic digests over `crypto.subtle`. Async and non-negotiably so — `SubtleCrypto.digest` returns a
// promise, and there is no synchronous hash in the platform. A caller that needs a hash inside a render pass
// must compute it in an effect and hold the result in state; do not go looking for a sync variant.
//
// Decisions worth stating:
//  - The input type is widened to `string | ArrayBuffer | Uint8Array` and normalized here, because every
//    call site otherwise repeats the same `new TextEncoder().encode(...)` line and they eventually disagree
//    about encoding. Strings are always UTF-8 — the only encoding that makes a digest reproducible across a
//    JS client and a .NET backend computing the same hash.
//  - Bytes are returned, not hex. A digest's natural type is bytes: `timingSafeEqual` consumes them
//    directly, and the caller picks the rendering (`bytesToHex` for an ETag, `bytesToBase64` for a
//    `Content-Digest` header). `sha256Hex` exists because hex is the common case and chaining two calls for
//    it is noise.
//  - SHA-1 is exposed despite being broken for signatures. It is still the correct tool for a non-adversarial
//    checksum and, more to the point, for interoperating with systems that already speak it (git object ids,
//    legacy ETags). Its JSDoc says so; picking it for anything security-bearing is the call site's error.
//  - `crypto.subtle` is absent outside a secure context, so every function here throws at the call site when
//    it is missing — see `WebCrypto.ts` for the full contract and `isSubtleAvailable()` for the probe.

import { bytesToHex, utf8ToBytes } from './Encoding';
import { requireSubtle } from './WebCrypto';

/** Accepted digest input: a UTF-8-encoded string, a raw `ArrayBuffer`, or an existing byte view. */
export type BinaryInput = string | ArrayBuffer | Uint8Array;

/** A hash algorithm `crypto.subtle.digest` implements. SHA-256 is the default choice; SHA-1 is checksum/interop only. */
export type DigestAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

/** Normalizes any {@link BinaryInput} to bytes; strings become UTF-8. Internal — not exported from the barrel. */
export function toBytes(data: BinaryInput): Uint8Array {
  if (typeof data === 'string') return utf8ToBytes(data);
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

/**
 * Hashes `data` with the named algorithm and resolves to the raw digest bytes — the general form the named
 * helpers below wrap. **Throws** synchronously when `crypto.subtle` is unavailable (insecure context).
 */
export async function digest(algorithm: DigestAlgorithm, data: BinaryInput): Promise<Uint8Array> {
  const subtle = requireSubtle();

  // TS 5.7 made `Uint8Array` generic over its backing buffer and narrowed `BufferSource` to
  // `ArrayBufferView<ArrayBuffer>`, which excludes the `SharedArrayBuffer`-backed views the default
  // `Uint8Array<ArrayBufferLike>` still admits. `subtle.digest` reads any byte view at runtime, so this
  // widens the static type without changing behaviour — and without narrowing what callers may pass in.
  const hashed = await subtle.digest(algorithm, toBytes(data) as BufferSource);

  return new Uint8Array(hashed);
}

/** Computes the SHA-256 digest of `data` (32 bytes) — the default hash for cache keys, ETags, and content addressing. */
export function sha256(data: BinaryInput): Promise<Uint8Array> {
  return digest('SHA-256', data);
}

/**
 * Computes the SHA-1 digest of `data` (20 bytes). **Not collision-resistant** — use it only for
 * non-adversarial checksums or to interoperate with a system that already speaks SHA-1 (git, legacy ETags).
 * Reach for {@link sha256} everywhere else.
 */
export function sha1(data: BinaryInput): Promise<Uint8Array> {
  return digest('SHA-1', data);
}

/** Computes the SHA-384 digest of `data` (48 bytes) — the truncated SHA-512 variant used by subresource integrity. */
export function sha384(data: BinaryInput): Promise<Uint8Array> {
  return digest('SHA-384', data);
}

/** Computes the SHA-512 digest of `data` (64 bytes) — wider margin than SHA-256, and faster on 64-bit hardware. */
export function sha512(data: BinaryInput): Promise<Uint8Array> {
  return digest('SHA-512', data);
}

/** Computes the SHA-256 digest of `data` as a lowercase 64-char hex string — the ready-to-print form for an ETag or cache key. */
export async function sha256Hex(data: BinaryInput): Promise<string> {
  return bytesToHex(await sha256(data));
}
