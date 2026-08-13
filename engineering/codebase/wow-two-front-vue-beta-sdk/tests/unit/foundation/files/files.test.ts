import { describe, expect, it } from 'vitest';
import {
  fileBaseName,
  fileExtension,
  matchesAccept,
  matchesAcceptType,
  parseAcceptTokens,
  safeFileName,
} from '@src/foundation/files';

/*
 * Smoke depth, `unit` project (node). Covers the PURE half of the slice — the `accept` matcher
 * and the filename helpers. `readFileAs*` needs a real `FileReader` and `downloadBlob` needs a
 * document to click an anchor into; both belong to the browser tier, so neither is faked here.
 */

describe('parseAcceptTokens', () => {
  it('splits, trims, and treats an absent list as empty', () => {
    expect(parseAcceptTokens('image/png, .pdf ,text/*')).toEqual(['image/png', '.pdf', 'text/*']);
    expect(parseAcceptTokens(undefined)).toEqual([]);
  });
});

describe('matchesAcceptType', () => {
  it('matches an exact mime type and a wildcard family', () => {
    expect(matchesAcceptType('image/png', 'image/png')).toBe(true);
    expect(matchesAcceptType('image/png', 'image/*')).toBe(true);
    expect(matchesAcceptType('image/png', 'text/*')).toBe(false);
  });

  /* An empty `accept` means "anything goes" — a picker with no filter must not reject
     everything, which is what a naive `tokens.includes(...)` would do. */
  it('accepts anything when no list is given', () => {
    expect(matchesAcceptType('application/octet-stream', undefined)).toBe(true);
    expect(matchesAcceptType('application/octet-stream', '')).toBe(true);
  });
});

describe('matchesAccept', () => {
  it('matches on the extension as well as the type', () => {
    const file = { name: 'report.pdf', type: 'application/pdf' };

    expect(matchesAccept(file, '.pdf')).toBe(true);
    expect(matchesAccept(file, 'application/pdf')).toBe(true);
    expect(matchesAccept(file, 'image/*')).toBe(false);
  });
});

describe('filename helpers', () => {
  it('splits a name into base and extension', () => {
    expect(fileExtension('archive.tar.gz')).toBe('gz');
    expect(fileBaseName('archive.tar.gz')).toBe('archive.tar');
    expect(fileExtension('no-extension')).toBe('');
  });

  /* The documented set: path separators, the Windows-reserved characters, control characters,
     and leading/trailing dots. Interior dots survive — `archive.tar.gz` has to. */
  it('strips path separators and reserved characters', () => {
    expect(safeFileName('../../etc/passwd')).not.toMatch(/[/\\<>:"|?*]/);
    expect(safeFileName('a<b>c:d"e|f?g*h')).not.toMatch(/[<>:"|?*]/);
  });

  it('trims leading and trailing dots, keeping interior ones', () => {
    expect(safeFileName('...report...')).toBe('report');
    expect(safeFileName('archive.tar.gz')).toBe('archive.tar.gz');
  });

  it('never returns an empty name', () => {
    expect(safeFileName('')).toBe('file');
    expect(safeFileName('...')).toBe('file');
  });

  it('preserves the extension when truncating', () => {
    expect(safeFileName('a'.repeat(400) + '.pdf', { maxLength: 20 })).toMatch(/\.pdf$/);
  });
});
