import { describe, expect, it } from 'vitest';

import {
  fileBaseName,
  fileExtension,
  matchesAccept,
  matchesAcceptType,
  parseAcceptTokens,
  safeFileName,
} from '@src/foundation/files';

// Node project — accept-matching and name parsing are pure string work. The `FileReader` / download helpers need
// a real DOM and live in `files.browser.test.ts`.

/** A `FileLike` stand-in — accept-matching reads only `name` + `type`, so no real `File` is needed. */
function file(name: string, type: string) {
  return { name, type };
}

describe('parseAcceptTokens', () => {
  it('splits, trims, lower-cases, and drops blanks', () => {
    expect(parseAcceptTokens(' .PNG , image/*,, application/pdf ')).toEqual(['.png', 'image/*', 'application/pdf']);
  });

  it('returns an empty list for an absent or blank accept', () => {
    expect(parseAcceptTokens(undefined)).toEqual([]);
    expect(parseAcceptTokens('')).toEqual([]);
  });
});

describe('matchesAccept', () => {
  it('accepts everything when no accept list is given', () => {
    expect(matchesAccept(file('a.exe', 'application/x-msdownload'))).toBe(true);
    expect(matchesAccept(file('a.exe', 'application/x-msdownload'), '')).toBe(true);
  });

  it('matches an extension token against the file name, case-insensitively', () => {
    expect(matchesAccept(file('Photo.PNG', ''), '.png')).toBe(true);
    expect(matchesAccept(file('doc.pdf', ''), '.png')).toBe(false);
  });

  it('matches a wildcard MIME token against the type prefix', () => {
    expect(matchesAccept(file('p.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(file('d.pdf', 'application/pdf'), 'image/*')).toBe(false);
  });

  it('matches an exact MIME token', () => {
    expect(matchesAccept(file('d.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(matchesAccept(file('d.pdf', 'application/pdf'), 'application/json')).toBe(false);
  });

  it('accepts when any one token matches', () => {
    expect(matchesAccept(file('d.pdf', 'application/pdf'), 'image/*,.pdf')).toBe(true);
  });
});

describe('matchesAcceptType (advisory, pre-drop)', () => {
  it('judges MIME tokens normally', () => {
    expect(matchesAcceptType('image/png', 'image/*')).toBe(true);
    expect(matchesAcceptType('application/pdf', 'image/*')).toBe(false);
  });

  it('allows unverifiable extension tokens by default, deferring to the drop', () => {
    expect(matchesAcceptType('image/png', '.png')).toBe(true);
    expect(matchesAcceptType('application/pdf', '.png')).toBe(true); // can't verify without a name
  });

  it('fails closed on extension tokens when asked', () => {
    expect(matchesAcceptType('application/pdf', '.png', { extensionTokens: 'reject' })).toBe(false);
  });
});

describe('fileExtension / fileBaseName', () => {
  it('splits a normal name', () => {
    expect(fileExtension('report.PDF')).toBe('pdf');
    expect(fileBaseName('report.final.pdf')).toBe('report.final');
  });

  it('treats a dotfile as having no extension', () => {
    expect(fileExtension('.gitignore')).toBe('');
    expect(fileBaseName('.gitignore')).toBe('.gitignore');
  });

  it('handles a missing or trailing dot', () => {
    expect(fileExtension('README')).toBe('');
    expect(fileExtension('weird.')).toBe('');
    expect(fileBaseName('README')).toBe('README');
  });
});

describe('safeFileName', () => {
  it('replaces path separators and reserved characters', () => {
    expect(safeFileName('a/b\\c:d*e?.txt')).toBe('a-b-c-d-e-.txt');
  });

  it('trims leading/trailing dots and spaces and collapses whitespace', () => {
    expect(safeFileName('  ..my   report..  ')).toBe('my report');
  });

  it('keeps ordinary hyphens and spaces intact', () => {
    expect(safeFileName('my-file name.txt')).toBe('my-file name.txt');
  });

  it('falls back when nothing usable remains', () => {
    expect(safeFileName('...')).toBe('file');
    expect(safeFileName('')).toBe('file');
  });

  it('truncates while preserving the extension', () => {
    const long = `${'a'.repeat(300)}.txt`;
    const result = safeFileName(long, { maxLength: 20 });
    expect(result).toHaveLength(20);
    expect(result.endsWith('.txt')).toBe(true);
  });
});
