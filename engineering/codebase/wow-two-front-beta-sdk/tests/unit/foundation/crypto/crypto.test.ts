// Unit coverage for `foundation/crypto`. Runs on the node project — Node 20+ exposes WebCrypto on
// `globalThis.crypto`, so digests and `getRandomValues` are real here, not mocked.
//
// Two things this suite deliberately does NOT do:
//  - It does not check digests only against themselves. A self-consistent hash proves the code is
//    deterministic, not that it is SHA-256; a transposed algorithm name would pass. Every digest is checked
//    against the published FIPS 180-4 test vector for "abc" (and the empty string), so the assertion fails
//    if the wiring ever points at the wrong algorithm.
//  - It does not assert `randomString` output statistically-only. The rejection-sampling path is driven
//    with a scripted byte source through the injected `randomStringFrom` seam, so "biased bytes are
//    discarded" is proven deterministically rather than inferred from a distribution.

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  base64ToBytes,
  base64UrlToBytes,
  bytesToBase64,
  bytesToBase64Url,
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  utf8ToBytes,
} from '@src/foundation/crypto/Encoding';
import { digest, sha1, sha256, sha256Hex, sha384, sha512 } from '@src/foundation/crypto/Digest';
import {
  URL_SAFE_ALPHABET,
  randomBytes,
  randomString,
  randomStringFrom,
  rejectionLimit,
} from '@src/foundation/crypto/Random';
import { timingSafeEqual } from '@src/foundation/crypto/TimingSafeEqual';
import { hashObject, stableStringify } from '@src/foundation/crypto/HashObject';
import { isCryptoAvailable, isSubtleAvailable } from '@src/foundation/crypto/WebCrypto';

/** Published FIPS 180-4 digests of the string "abc" — the standard known-answer vectors. */
const ABC_VECTORS = {
  'SHA-1': 'a9993e364706816aba3e25717850c26c9cd0d89d',
  'SHA-256': 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'SHA-384':
    'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
  'SHA-512':
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
} as const;

/** Every byte value 0..255 — exercises the high half (0x80..0xFF) that a sign-extension bug would corrupt. */
const ALL_BYTES = new Uint8Array(Array.from({ length: 256 }, (_, i) => i));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('bytesToHex / hexToBytes', () => {
  it('round-trips the full byte range including 0x00 and 0xFF', () => {
    const hex = bytesToHex(ALL_BYTES);
    expect(hex).toHaveLength(512);
    expect(hex.startsWith('000102')).toBe(true);
    expect(hex.endsWith('fdfeff')).toBe(true);
    expect(hexToBytes(hex)).toEqual(ALL_BYTES);
  });

  it('round-trips empty input', () => {
    expect(bytesToHex(new Uint8Array(0))).toBe('');
    expect(hexToBytes('')).toEqual(new Uint8Array(0));
  });

  it('emits lowercase but accepts either case on parse', () => {
    expect(bytesToHex(new Uint8Array([0xab, 0xcd]))).toBe('abcd');
    expect(hexToBytes('ABCD')).toEqual(new Uint8Array([0xab, 0xcd]));
    expect(hexToBytes('AbCd')).toEqual(new Uint8Array([0xab, 0xcd]));
  });

  it('throws a TypeError on an odd-length string', () => {
    expect(() => hexToBytes('abc')).toThrow(TypeError);
    expect(() => hexToBytes('a')).toThrow(/even-length/);
  });

  it('throws a TypeError on a non-hex character', () => {
    expect(() => hexToBytes('zz')).toThrow(TypeError);
    expect(() => hexToBytes('00ff0g')).toThrow(TypeError);
    expect(() => hexToBytes('00 ff')).toThrow(TypeError);
    expect(() => hexToBytes('0x00ff')).toThrow(TypeError);
  });
});

describe('bytesToBase64 / base64ToBytes', () => {
  it('round-trips the full byte range', () => {
    expect(base64ToBytes(bytesToBase64(ALL_BYTES))).toEqual(ALL_BYTES);
  });

  it('round-trips empty input', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
  });

  it('matches known encodings and pads to a 4-char boundary', () => {
    expect(bytesToBase64(utf8ToBytes('hello'))).toBe('aGVsbG8=');
    expect(bytesToBase64(utf8ToBytes('hi'))).toBe('aGk=');
    expect(bytesToBase64(utf8ToBytes('abcd'))).toBe('YWJjZA==');
    expect(bytesToUtf8(base64ToBytes('aGVsbG8='))).toBe('hello');
  });

  it('emits the standard + and / for high bytes', () => {
    expect(bytesToBase64(new Uint8Array([0xfb, 0xff]))).toBe('+/8=');
  });

  it('decodes with or without padding', () => {
    expect(base64ToBytes('aGk=')).toEqual(utf8ToBytes('hi'));
    expect(base64ToBytes('aGk')).toEqual(utf8ToBytes('hi'));
  });

  it('rejects malformed input rather than returning garbage', () => {
    expect(() => base64ToBytes('a')).toThrow(TypeError); // impossible length
    expect(() => base64ToBytes('aGk==')).toThrow(TypeError); // over-padded
    expect(() => base64ToBytes('aG k=')).toThrow(TypeError); // whitespace
    expect(() => base64ToBytes('aGk*')).toThrow(TypeError); // outside the alphabet
    expect(() => base64ToBytes('-_8')).toThrow(TypeError); // base64url, wrong decoder
    expect(() => base64ToBytes('aGVsbG8=extra')).toThrow(TypeError); // trailing data after padding
  });

  it('handles an input large enough to overflow a naive spread', () => {
    const large = new Uint8Array(200_000).fill(0xa7);
    expect(base64ToBytes(bytesToBase64(large))).toEqual(large);
  });
});

describe('bytesToBase64Url / base64UrlToBytes', () => {
  it('round-trips the full byte range', () => {
    expect(base64UrlToBytes(bytesToBase64Url(ALL_BYTES))).toEqual(ALL_BYTES);
  });

  it('round-trips empty input', () => {
    expect(bytesToBase64Url(new Uint8Array(0))).toBe('');
    expect(base64UrlToBytes('')).toEqual(new Uint8Array(0));
  });

  it('never emits +, / or = across every byte-length remainder', () => {
    for (let length = 0; length <= 32; length++) {
      const encoded = bytesToBase64Url(ALL_BYTES.subarray(0, length));
      expect(encoded).not.toMatch(/[+/=]/);
    }
  });

  it('substitutes - and _ for the standard + and /', () => {
    const bytes = new Uint8Array([0xfb, 0xff]);
    expect(bytesToBase64(bytes)).toBe('+/8=');
    expect(bytesToBase64Url(bytes)).toBe('-_8');
    expect(base64UrlToBytes('-_8')).toEqual(bytes);
  });

  it('tolerates padding on input even though it never emits it', () => {
    expect(base64UrlToBytes('-_8=')).toEqual(new Uint8Array([0xfb, 0xff]));
  });

  it('rejects standard-base64 characters and other malformed input', () => {
    expect(() => base64UrlToBytes('+/8=')).toThrow(TypeError);
    expect(() => base64UrlToBytes('a')).toThrow(TypeError);
    expect(() => base64UrlToBytes('aG k')).toThrow(TypeError);
    expect(() => base64UrlToBytes('aGk*')).toThrow(TypeError);
  });
});

describe('utf8ToBytes / bytesToUtf8', () => {
  it('round-trips ASCII, accents, CJK, and astral emoji', () => {
    for (const text of ['', 'hello', 'héllo wörld', '日本語テキスト', '👋🏽 family 👨‍👩‍👧‍👦']) {
      expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
    }
  });

  it('encodes multi-byte characters to their UTF-8 sequences', () => {
    expect(utf8ToBytes('a')).toEqual(new Uint8Array([0x61]));
    expect(utf8ToBytes('é')).toEqual(new Uint8Array([0xc3, 0xa9]));
    expect(utf8ToBytes('€')).toEqual(new Uint8Array([0xe2, 0x82, 0xac]));
  });

  it('is lossy for arbitrary binary — the documented reason digests render as hex', () => {
    const roundTripped = utf8ToBytes(bytesToUtf8(new Uint8Array([0xff, 0xfe])));
    expect(roundTripped).not.toEqual(new Uint8Array([0xff, 0xfe]));
  });
});

describe('digests — known-answer vectors', () => {
  it('sha256("abc") matches the published FIPS 180-4 vector', async () => {
    expect(bytesToHex(await sha256('abc'))).toBe(ABC_VECTORS['SHA-256']);
    expect(await sha256Hex('abc')).toBe(ABC_VECTORS['SHA-256']);
  });

  it('sha1("abc") matches the published vector', async () => {
    expect(bytesToHex(await sha1('abc'))).toBe(ABC_VECTORS['SHA-1']);
  });

  it('sha384("abc") matches the published vector', async () => {
    expect(bytesToHex(await sha384('abc'))).toBe(ABC_VECTORS['SHA-384']);
  });

  it('sha512("abc") matches the published vector', async () => {
    expect(bytesToHex(await sha512('abc'))).toBe(ABC_VECTORS['SHA-512']);
  });

  it('hashes the empty string to the published empty-input vectors', async () => {
    expect(await sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(bytesToHex(await sha1(''))).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  it('routes each algorithm name to the matching vector through the generic digest()', async () => {
    for (const [algorithm, expected] of Object.entries(ABC_VECTORS)) {
      const bytes = await digest(algorithm as keyof typeof ABC_VECTORS, 'abc');
      expect(bytesToHex(bytes)).toBe(expected);
    }
  });

  it('returns the documented digest widths', async () => {
    expect(await sha1('abc')).toHaveLength(20);
    expect(await sha256('abc')).toHaveLength(32);
    expect(await sha384('abc')).toHaveLength(48);
    expect(await sha512('abc')).toHaveLength(64);
  });
});

describe('digests — input normalization', () => {
  it('treats a string, its UTF-8 bytes, and the backing ArrayBuffer as the same input', async () => {
    const bytes = utf8ToBytes('abc');

    // Built as a standalone, exactly-sized ArrayBuffer rather than `bytes.buffer.slice(...)`: the latter is
    // typed `ArrayBuffer | SharedArrayBuffer`, and this also exercises the detached-from-any-view path.
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);

    const [fromString, fromBytes, fromBuffer] = await Promise.all([
      sha256Hex('abc'),
      sha256(bytes),
      sha256(buffer),
    ]);

    expect(fromString).toBe(ABC_VECTORS['SHA-256']);
    expect(bytesToHex(fromBytes)).toBe(ABC_VECTORS['SHA-256']);
    expect(bytesToHex(fromBuffer)).toBe(ABC_VECTORS['SHA-256']);
  });

  it('hashes non-ASCII deterministically via UTF-8', async () => {
    expect(await sha256Hex('héllo')).toBe(bytesToHex(await sha256(utf8ToBytes('héllo'))));
  });
});

describe('randomBytes', () => {
  it('returns the requested length', () => {
    expect(randomBytes(0)).toHaveLength(0);
    expect(randomBytes(1)).toHaveLength(1);
    expect(randomBytes(32)).toHaveLength(32);
  });

  it('produces different bytes across calls', () => {
    expect(bytesToHex(randomBytes(32))).not.toBe(bytesToHex(randomBytes(32)));
  });

  it('fills past the 65536-byte per-call ceiling without leaving a zero tail', () => {
    const bytes = randomBytes(70_000);
    expect(bytes).toHaveLength(70_000);

    // The tail beyond the first chunk must have been filled by a second pass, not left at zero.
    const tail = bytes.subarray(65_536);
    expect(tail.some((byte) => byte !== 0)).toBe(true);
  });

  it('throws a RangeError on a negative or fractional length', () => {
    expect(() => randomBytes(-1)).toThrow(RangeError);
    expect(() => randomBytes(1.5)).toThrow(RangeError);
    expect(() => randomBytes(Number.NaN)).toThrow(RangeError);
  });
});

describe('randomString', () => {
  it('returns the requested length', () => {
    expect(randomString(0)).toBe('');
    expect(randomString(1)).toHaveLength(1);
    expect(randomString(21)).toHaveLength(21);
    expect(randomString(500)).toHaveLength(500);
  });

  it('only ever emits characters from the alphabet, over many samples', () => {
    const allowed = new Set(URL_SAFE_ALPHABET);
    for (let sample = 0; sample < 200; sample++) {
      for (const char of randomString(40)) expect(allowed.has(char)).toBe(true);
    }
  });

  it('emits nothing that needs URL escaping', () => {
    expect(randomString(2_000)).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('honours a custom alphabet', () => {
    expect(randomString(100, 'ab')).toMatch(/^[ab]{100}$/);
    expect(randomString(50, 'x')).toBe('x'.repeat(50));
  });

  it('treats an astral-plane alphabet by code point, never splitting a surrogate pair', () => {
    const generated = randomString(20, '🍎🍌🍒');
    expect([...generated]).toHaveLength(20);
    for (const char of generated) expect('🍎🍌🍒').toContain(char);
  });

  it('differs across calls', () => {
    expect(randomString(24)).not.toBe(randomString(24));
  });

  it('covers the whole alphabet given enough samples (no truncated range)', () => {
    const seen = new Set(randomString(20_000));
    expect(seen.size).toBe(URL_SAFE_ALPHABET.length);
  });
});

describe('randomString — modulo-bias rejection sampling', () => {
  /** Builds a byte source that replays a scripted sequence, so the rejection path is deterministic. */
  function scriptedSource(script: readonly number[]): (count: number) => Uint8Array {
    let cursor = 0;
    return (count: number) => {
      const slice = script.slice(cursor, cursor + count);
      cursor += slice.length;
      return new Uint8Array(slice);
    };
  }

  it('computes the largest unbiased bound for a given alphabet size', () => {
    expect(rejectionLimit(62)).toBe(248); // 4 x 62, discarding 248..255
    expect(rejectionLimit(3)).toBe(255);
    expect(rejectionLimit(16)).toBe(256); // divides 256 evenly — nothing to discard
    expect(rejectionLimit(1)).toBe(256);
    expect(rejectionLimit(256)).toBe(256);
  });

  it('discards out-of-range bytes instead of folding them in with a modulo', () => {
    const chars = [...URL_SAFE_ALPHABET];

    // 248..255 are the biased residues for a 62-char alphabet. A naive `% 62` would map 248 -> 'A',
    // 249 -> 'B', 250 -> 'C' and produce 'ABC'; correct rejection skips them and reads 0, 1, 2 instead.
    const generated = randomStringFrom(3, chars, scriptedSource([248, 249, 250, 255, 0, 1, 2]));

    expect(generated).toBe('ABC');
    expect(chars.at(248 % 62)).toBe('A'); // the value the biased implementation would have used
  });

  it('keeps drawing until enough in-range bytes arrive', () => {
    const script = [...Array.from({ length: 40 }, () => 250), 5, 6];
    expect(randomStringFrom(2, [...URL_SAFE_ALPHABET], scriptedSource(script))).toBe('FG');
  });

  it('maps in-range bytes by modulo once the bias is excluded', () => {
    const chars = [...URL_SAFE_ALPHABET];

    // 0 -> 'A' (index 0) · 61 -> '9' (last index) · 62 -> wraps to index 0, 'A' · 87 -> index 25, 'Z'.
    expect(randomStringFrom(4, chars, scriptedSource([0, 61, 62, 87]))).toBe('A9AZ');
  });

  it('throws rather than looping forever when the byte source is exhausted', () => {
    expect(() => randomStringFrom(4, [...URL_SAFE_ALPHABET], scriptedSource([1, 2]))).toThrow(
      RangeError,
    );
  });

  it('rejects an alphabet that cannot be sampled unbiasedly from one byte', () => {
    expect(() => randomStringFrom(4, [], randomBytes)).toThrow(RangeError);
    expect(() => randomString(4, '')).toThrow(RangeError);

    const tooLarge = Array.from({ length: 257 }, (_, i) => String.fromCharCode(i));
    expect(() => randomStringFrom(4, tooLarge, randomBytes)).toThrow(/1\.\.256/);
  });

  it('throws a RangeError on a negative or fractional length', () => {
    expect(() => randomString(-1)).toThrow(RangeError);
    expect(() => randomString(2.5)).toThrow(RangeError);
  });
});

describe('timingSafeEqual', () => {
  it('is true for equal contents, including empty arrays', () => {
    expect(timingSafeEqual(new Uint8Array(0), new Uint8Array(0))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(timingSafeEqual(ALL_BYTES, ALL_BYTES.slice())).toBe(true);
  });

  it('is false when any byte differs — first, middle, or last', () => {
    expect(timingSafeEqual(new Uint8Array([9, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 9, 3]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2, 9]), new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it('is false for unequal lengths, including a shared prefix', () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array(0), new Uint8Array([0]))).toBe(false);
  });

  it('does not treat a zero-padded tail as a match', () => {
    expect(timingSafeEqual(new Uint8Array([1, 0]), new Uint8Array([1]))).toBe(false);
  });

  it('compares real digests', async () => {
    const [a, b, c] = await Promise.all([sha256('abc'), sha256('abc'), sha256('abd')]);
    expect(timingSafeEqual(a, b)).toBe(true);
    expect(timingSafeEqual(a, c)).toBe(false);
  });
});

describe('stableStringify', () => {
  it('sorts object keys so insertion order cannot change the output', () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it('sorts at every depth', () => {
    expect(stableStringify({ z: { d: 4, c: 3 }, a: { b: 2 } })).toBe('{"a":{"b":2},"z":{"c":3,"d":4}}');
  });

  it('preserves array order — order is semantic in an array', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it('sorts keys of objects nested inside arrays', () => {
    expect(stableStringify([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  });

  it('honours toJSON so a Date canonicalizes to its ISO string', () => {
    const date = new Date('2026-07-19T00:00:00.000Z');
    expect(stableStringify({ at: date })).toBe('{"at":"2026-07-19T00:00:00.000Z"}');
  });

  it('returns a string even for values JSON.stringify drops', () => {
    expect(stableStringify(undefined)).toBe('undefined');
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(7)).toBe('7');
    expect(stableStringify('x')).toBe('"x"');
  });

  it('allows a repeated reference but throws a TypeError on a true cycle', () => {
    const shared = { a: 1 };
    expect(stableStringify({ first: shared, second: shared })).toBe('{"first":{"a":1},"second":{"a":1}}');

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => stableStringify(cyclic)).toThrow(TypeError);
    expect(() => stableStringify(cyclic)).toThrow(/circular/);
  });
});

describe('hashObject', () => {
  it('is independent of key order', async () => {
    const [first, second] = await Promise.all([hashObject({ a: 1, b: 2 }), hashObject({ b: 2, a: 1 })]);
    expect(first).toBe(second);
  });

  it('is independent of key order at every nesting depth', async () => {
    const [first, second] = await Promise.all([
      hashObject({ x: { p: 1, q: { m: 1, n: 2 } }, y: [1, 2] }),
      hashObject({ y: [1, 2], x: { q: { n: 2, m: 1 }, p: 1 } }),
    ]);
    expect(first).toBe(second);
  });

  it('distinguishes different values, different arrays, and array order', async () => {
    const [base, changedValue, reordered, ordered] = await Promise.all([
      hashObject({ a: 1, b: 2 }),
      hashObject({ a: 1, b: 3 }),
      hashObject({ list: [2, 1] }),
      hashObject({ list: [1, 2] }),
    ]);

    expect(changedValue).not.toBe(base);
    expect(reordered).not.toBe(ordered);
  });

  it('returns a lowercase 64-char SHA-256 hex string matching the canonical form', async () => {
    const hash = await hashObject({ b: 2, a: 1 });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(await sha256Hex('{"a":1,"b":2}'));
  });
});

describe('capability probes', () => {
  it('reports both capabilities present under Node WebCrypto', () => {
    expect(isCryptoAvailable()).toBe(true);
    expect(isSubtleAvailable()).toBe(true);
  });

  it('reports both absent, and throws a diagnostic error, when globalThis.crypto is missing', async () => {
    vi.stubGlobal('crypto', undefined);

    expect(isCryptoAvailable()).toBe(false);
    expect(isSubtleAvailable()).toBe(false);
    expect(() => randomBytes(8)).toThrow(/Web Crypto is unavailable/);
    await expect(sha256('abc')).rejects.toThrow(/secure context/);
  });

  it('separates the two capabilities when subtle alone is missing (an insecure context)', () => {
    vi.stubGlobal('crypto', { getRandomValues: (view: Uint8Array) => view });

    expect(isCryptoAvailable()).toBe(true);
    expect(isSubtleAvailable()).toBe(false);
  });

  it('restores the real implementation after unstubbing', () => {
    expect(isSubtleAvailable()).toBe(true);
    expect(randomBytes(4)).toHaveLength(4);
  });
});
