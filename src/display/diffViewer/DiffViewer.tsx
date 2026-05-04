import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';

export type DiffView = 'split' | 'unified';

type DiffOp = 'unchanged' | 'added' | 'removed';

interface DiffRow {
  op: DiffOp;
  leftNum: number | null;
  rightNum: number | null;
  text: string;
}

export interface DiffViewerProps extends HTMLAttributes<HTMLDivElement> {
  left: string;
  right: string;
  view?: DiffView;
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  showStats?: boolean;
}

/**
 * Line-level diff viewer (split / unified). Own LCS implementation; no
 * external diff dep. For intra-line word highlighting, install `diff` and
 * post-process — deferred.
 */
export const DiffViewer = forwardRef<HTMLDivElement, DiffViewerProps>(function DiffViewer(
  { left, right, view = 'split', leftLabel = 'Before', rightLabel = 'After', showStats = true, className, ...rest },
  ref,
) {
  const rows = useMemo(() => computeDiff(left, right), [left, right]);
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const r of rows) {
      if (r.op === 'added') added += 1;
      if (r.op === 'removed') removed += 1;
    }
    return { added, removed };
  }, [rows]);

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-md border border-border bg-card font-mono text-xs text-card-foreground shadow-sm',
        className,
      )}
      {...rest}
    >
      {showStats && (
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5 text-xs">
          <div className="text-muted-foreground">{leftLabel} → {rightLabel}</div>
          <div className="flex items-center gap-3">
            <span className="text-success font-medium">+{stats.added}</span>
            <span className="text-destructive font-medium">−{stats.removed}</span>
          </div>
        </div>
      )}
      {view === 'split' ? <SplitView rows={rows} /> : <UnifiedView rows={rows} />}
    </div>
  );
});

function SplitView({ rows }: { rows: DiffRow[] }) {
  // Pair removed/added rows row-by-row when possible to align them.
  // Simple alignment: walk, when we hit "removed" followed by "added", pair them.
  const pairs: Array<{ left?: DiffRow; right?: DiffRow }> = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (r.op === 'unchanged') {
      pairs.push({ left: r, right: r });
    } else if (r.op === 'removed') {
      const next = rows[i + 1];
      if (next && next.op === 'added') {
        pairs.push({ left: r, right: next });
        i++;
      } else {
        pairs.push({ left: r });
      }
    } else if (r.op === 'added') {
      pairs.push({ right: r });
    }
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-border">
      <DiffColumn rows={pairs.map((p) => p.left)} />
      <DiffColumn rows={pairs.map((p) => p.right)} side="right" />
    </div>
  );
}

function DiffColumn({ rows, side = 'left' }: { rows: Array<DiffRow | undefined>; side?: 'left' | 'right' }) {
  return (
    <div className="overflow-x-auto">
      {rows.map((r, i) => {
        if (!r) {
          return (
            <div key={i} className="flex bg-muted/30">
              <span className="select-none w-10 shrink-0 px-2 py-0.5 text-right text-muted-foreground">·</span>
              <span className="flex-1 whitespace-pre px-2 py-0.5">&nbsp;</span>
            </div>
          );
        }
        const num = side === 'left' ? r.leftNum : r.rightNum;
        const isChanged =
          (side === 'left' && r.op === 'removed') || (side === 'right' && r.op === 'added');
        return (
          <div
            key={i}
            data-state={r.op}
            className={cn(
              'flex',
              isChanged && side === 'left' && 'bg-destructive-soft',
              isChanged && side === 'right' && 'bg-success-soft',
            )}
          >
            <span className="select-none w-10 shrink-0 border-r border-border px-2 py-0.5 text-right text-muted-foreground tabular-nums">
              {num ?? ''}
            </span>
            <span className="flex-1 whitespace-pre px-2 py-0.5">{r.text || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}

function UnifiedView({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="overflow-x-auto">
      {rows.map((r, i) => (
        <div
          key={i}
          data-state={r.op}
          className={cn(
            'flex',
            r.op === 'added' && 'bg-success-soft',
            r.op === 'removed' && 'bg-destructive-soft',
          )}
        >
          <span className="select-none w-10 shrink-0 border-r border-border px-2 py-0.5 text-right text-muted-foreground tabular-nums">
            {r.leftNum ?? ''}
          </span>
          <span className="select-none w-10 shrink-0 border-r border-border px-2 py-0.5 text-right text-muted-foreground tabular-nums">
            {r.rightNum ?? ''}
          </span>
          <span className="w-5 shrink-0 px-1 py-0.5 text-center text-muted-foreground">
            {r.op === 'added' ? '+' : r.op === 'removed' ? '−' : ' '}
          </span>
          <span className="flex-1 whitespace-pre px-2 py-0.5">{r.text || ' '}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * LCS-based line diff. Returns ordered rows with `unchanged` / `added` /
 * `removed` operations. O(n×m) time + space.
 */
function computeDiff(left: string, right: string): DiffRow[] {
  const a = left.split('\n');
  const b = right.split('\n');
  const n = a.length;
  const m = b.length;

  // LCS table: dp[i][j] = LCS length of a[0..i] and b[0..j].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      else dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }

  // Backtrack.
  const rows: DiffRow[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      rows.push({ op: 'unchanged', leftNum: i, rightNum: j, text: a[i - 1]! });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      rows.push({ op: 'added', leftNum: null, rightNum: j, text: b[j - 1]! });
      j--;
    } else if (i > 0) {
      rows.push({ op: 'removed', leftNum: i, rightNum: null, text: a[i - 1]! });
      i--;
    } else {
      break;
    }
  }
  rows.reverse();
  return rows;
}
