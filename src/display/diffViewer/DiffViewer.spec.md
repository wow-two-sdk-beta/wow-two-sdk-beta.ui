# DiffViewer

## Purpose
Side-by-side or unified line-diff between two text strings. Own minimal LCS-based implementation — no external diff library.

## Anatomy
```
<DiffViewer left right view="split|unified" />
```

`split` = left/right columns aligned by row.
`unified` = single column with `+` and `-` line markers.

## Required behaviors
- Compute line-level diff using LCS (Longest Common Subsequence).
- Mark unchanged / added / removed (+ optional `modified` for replaced lines).
- Render with line numbers per side.
- "+/− N" stats slot at top.

## Visual states
`split` (default) · `unified` · `empty (identical)`

## Props
| Name | Type | Default | Why |
|---|---|---|---|
| `left` | `string` | required | Original |
| `right` | `string` | required | Modified |
| `view` | `'split' \| 'unified'` | `'split'` | |
| `leftLabel` | `ReactNode` | `'Before'` | |
| `rightLabel` | `ReactNode` | `'After'` | |
| `showStats` | `boolean` | `true` | "+10 −3" header |

## Composition
Single component (no slots). Future iteration: word-level highlight inside changed lines.

## Accessibility
- Each row tagged `data-state` (`unchanged`/`added`/`removed`).
- Stats announced via `<Announce>` when diff updates? — deferred (would re-announce on every prop change).

## Dependencies
Foundation: `utils`. No cross-domain. No external lib.

## Known limitations
- Line-level only — no intra-line word/char highlight.
- O(n×m) memory; not suitable for huge diffs (>10k lines per side).
