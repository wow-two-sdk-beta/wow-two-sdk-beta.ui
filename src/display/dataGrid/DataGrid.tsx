import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export type DataGridCellType = 'text' | 'number' | 'select' | 'boolean';

export interface DataGridColumn<T> {
  key: string;
  header: ReactNode;
  /** Returns the cell's underlying value. */
  accessor: (row: T) => unknown;
  /** Optional custom cell renderer for read mode. */
  cell?: (row: T) => ReactNode;
  type?: DataGridCellType;
  options?: Array<{ value: string | number; label: ReactNode }>;
  editable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

export interface DataGridProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  columns: DataGridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowChange?: (row: T, colKey: string, value: unknown) => void;
  dense?: boolean;
}

interface CellPos {
  row: number;
  col: number;
}

function castValue(raw: string, type: DataGridCellType): unknown {
  if (type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  if (type === 'boolean') return raw === 'true';
  return raw;
}

/**
 * First-generation editable DataGrid. Keyboard nav between cells; click /
 * Enter / F2 enter edit; Escape reverts. Range select, fill, paste TSV are
 * deferred — log them in a follow-up batch.
 */
export const DataGrid = forwardRef<HTMLDivElement, DataGridProps<unknown>>(
  function DataGrid(
    { columns, rows, rowKey, onRowChange, dense, className, ...rest },
    ref,
  ) {
    const [active, setActive] = useState<CellPos>({ row: 0, col: 0 });
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

    useEffect(() => {
      if (editing && editRef.current) {
        editRef.current.focus();
        if ('select' in editRef.current && typeof editRef.current.select === 'function') {
          editRef.current.select();
        }
      }
    }, [editing]);

    const colCount = columns.length;
    const rowCount = rows.length;

    const beginEdit = useCallback(() => {
      const col = columns[active.col];
      const row = rows[active.row];
      if (!col || row === undefined) return;
      if (col.editable === false) return;
      const raw = col.accessor(row);
      setDraft(raw == null ? '' : String(raw));
      setEditing(true);
    }, [columns, rows, active]);

    const commitEdit = useCallback(
      (move?: 'right' | 'down') => {
        const col = columns[active.col];
        const row = rows[active.row];
        if (!col || row === undefined) {
          setEditing(false);
          return;
        }
        const value = castValue(draft, col.type ?? 'text');
        onRowChange?.(row, col.key, value);
        setEditing(false);
        if (move === 'right') setActive((a) => ({ row: a.row, col: Math.min(colCount - 1, a.col + 1) }));
        if (move === 'down') setActive((a) => ({ row: Math.min(rowCount - 1, a.row + 1), col: a.col }));
      },
      [columns, rows, active, draft, onRowChange, colCount, rowCount],
    );

    const cancelEdit = useCallback(() => {
      setEditing(false);
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (editing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit('down');
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit('right');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setActive((a) => ({ row: a.row, col: Math.min(colCount - 1, a.col + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActive((a) => ({ row: a.row, col: Math.max(0, a.col - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActive((a) => ({ row: Math.min(rowCount - 1, a.row + 1), col: a.col }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActive((a) => ({ row: Math.max(0, a.row - 1), col: a.col }));
          break;
        case 'Home':
          e.preventDefault();
          setActive((a) => ({ row: a.row, col: 0 }));
          break;
        case 'End':
          e.preventDefault();
          setActive((a) => ({ row: a.row, col: colCount - 1 }));
          break;
        case 'Enter':
        case 'F2':
          e.preventDefault();
          beginEdit();
          break;
      }
    };

    const cellPad = dense ? 'px-2 py-1' : 'px-3 py-2';

    return (
      <div
        ref={(el) => {
          containerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        role="grid"
        aria-rowcount={rowCount + 1}
        aria-colcount={colCount}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn(
          'overflow-auto rounded-md border border-border bg-card text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        {...rest}
      >
        <table className="w-full border-collapse">
          <thead role="rowgroup">
            <tr role="row" aria-rowindex={1} className="bg-muted/40">
              {columns.map((col, ci) => (
                <th
                  key={col.key}
                  role="columnheader"
                  aria-colindex={ci + 1}
                  scope="col"
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                  className={cn(
                    'border-b border-border font-medium text-muted-foreground',
                    cellPad,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {rows.map((row, ri) => (
              <tr key={rowKey(row)} role="row" aria-rowindex={ri + 2} className="border-b border-border last:border-b-0">
                {columns.map((col, ci) => {
                  const isActive = active.row === ri && active.col === ci;
                  const value = col.accessor(row);
                  const isEditable = col.editable !== false;
                  const isEditing = editing && isActive;
                  return (
                    <td
                      key={col.key}
                      role="gridcell"
                      aria-colindex={ci + 1}
                      aria-readonly={!isEditable || undefined}
                      aria-selected={isActive || undefined}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => {
                        setActive({ row: ri, col: ci });
                        if (isEditable && !isEditing) {
                          // Defer beginEdit to next render so active is set.
                          requestAnimationFrame(() => {
                            const c = columns[ci];
                            if (!c) return;
                            const r = rows[ri];
                            if (r === undefined) return;
                            const raw = c.accessor(r);
                            setDraft(raw == null ? '' : String(raw));
                            setEditing(true);
                          });
                        }
                      }}
                      style={{ textAlign: col.align ?? 'left' }}
                      className={cn(
                        'relative cursor-cell whitespace-nowrap',
                        cellPad,
                        isActive && 'bg-primary-soft/40 ring-2 ring-inset ring-primary',
                        !isEditable && 'cursor-default',
                      )}
                    >
                      {isEditing ? (
                        <CellEditor
                          ref={editRef as React.MutableRefObject<HTMLInputElement | HTMLSelectElement | null>}
                          col={col}
                          value={draft}
                          onChange={setDraft}
                          onCommit={commitEdit}
                          onCancel={cancelEdit}
                        />
                      ) : col.cell ? (
                        col.cell(row)
                      ) : col.type === 'boolean' ? (
                        <span className="tabular-nums">{value ? '✓' : '·'}</span>
                      ) : (
                        <span className="tabular-nums">{String(value ?? '')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
) as <T>(props: DataGridProps<T> & { ref?: React.Ref<HTMLDivElement> }) => React.ReactElement;

interface CellEditorProps {
  col: DataGridColumn<unknown>;
  value: string;
  onChange: (v: string) => void;
  onCommit: (move?: 'right' | 'down') => void;
  onCancel: () => void;
}

const CellEditor = forwardRef<HTMLInputElement | HTMLSelectElement, CellEditorProps>(
  function CellEditor({ col, value, onChange, onCommit, onCancel }, ref) {
    const baseClass = 'h-7 w-full rounded-sm border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
    if (col.type === 'select' && col.options) {
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onCommit('down');
          }}
          onBlur={() => onCommit()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          className={baseClass}
        >
          {col.options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {String(opt.label)}
            </option>
          ))}
        </select>
      );
    }
    if (col.type === 'boolean') {
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onCommit('down');
          }}
          onBlur={() => onCommit()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          className={baseClass}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={col.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        className={baseClass}
      />
    );
  },
);
