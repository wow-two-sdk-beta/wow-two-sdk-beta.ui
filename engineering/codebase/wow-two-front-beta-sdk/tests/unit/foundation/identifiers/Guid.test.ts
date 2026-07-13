import { describe, expect, it } from 'vitest';
import { Guid } from '@src/foundation/identifiers/Guid';

const D = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('Guid.createV7', () => {
  it('produces a lowercase D-string with version 7 and variant 0b10', () => {
    const g = Guid.createV7();
    expect(g).toMatch(D);
    expect(Guid.version(g)).toBe(7);
    expect('89ab').toContain(g[19]); // variant nibble
  });

  it('encodes the timestamp big-endian so string order == creation order', () => {
    const early = Guid.createV7(1_000_000_000_000);
    const late = Guid.createV7(2_000_000_000_000);
    expect(Guid.compare(early, late)).toBe(-1);
    expect(Guid.compare(late, early)).toBe(1);
    expect(early.slice(0, 8) < late.slice(0, 8)).toBe(true);
  });

  it('is unique across calls', () => {
    const set = new Set(Array.from({ length: 100 }, () => Guid.createV7()));
    expect(set.size).toBe(100);
  });
});

describe('Guid.createV4', () => {
  it('produces a version-4 GUID', () => {
    const g = Guid.createV4();
    expect(g).toMatch(D);
    expect(Guid.version(g)).toBe(4);
  });
});

describe('Guid.empty', () => {
  it('is the nil UUID', () => {
    expect(Guid.empty).toBe('00000000-0000-0000-0000-000000000000');
    expect(Guid.version(Guid.empty)).toBe(0);
  });
});

describe('Guid.parse / tryParse / isGuid', () => {
  it('parses + lowercases a valid GUID', () => {
    expect(Guid.parse('0197C8F4-3E2A-7C1D-8F9A-1B2C3D4E5F60')).toBe('0197c8f4-3e2a-7c1d-8f9a-1b2c3d4e5f60');
  });

  it('throws on a malformed string', () => {
    expect(() => Guid.parse('not-a-guid')).toThrow(TypeError);
  });

  it('tryParse returns undefined on failure, a Guid on success', () => {
    expect(Guid.tryParse('nope')).toBeUndefined();
    expect(Guid.tryParse('0197c8f4-3e2a-7c1d-8f9a-1b2c3d4e5f60')).toBeDefined();
  });

  it('isGuid narrows valid strings and rejects invalid', () => {
    expect(Guid.isGuid('0197c8f4-3e2a-7c1d-8f9a-1b2c3d4e5f60')).toBe(true);
    expect(Guid.isGuid('12345')).toBe(false);
  });
});

describe('Guid.equals', () => {
  it('is case-insensitive', () => {
    const lower = Guid.parse('0197c8f4-3e2a-7c1d-8f9a-1b2c3d4e5f60');
    const upper = Guid.tryParse('0197C8F4-3E2A-7C1D-8F9A-1B2C3D4E5F60')!;
    expect(Guid.equals(lower, upper)).toBe(true);
    expect(Guid.compare(lower, upper)).toBe(0);
  });
});
