import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { DataGrid, type DataGridColumn } from '@src/presentation/display/dataGrid/DataGrid';

interface Person {
  id: string;
  name: string;
  age: number;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

const INITIAL: Person[] = [
  { id: '1', name: 'Alice', age: 30, role: 'admin', active: true },
  { id: '2', name: 'Bob', age: 24, role: 'editor', active: true },
  { id: '3', name: 'Carol', age: 28, role: 'viewer', active: false },
  { id: '4', name: 'Dan', age: 35, role: 'editor', active: true },
];

const meta: Meta = {
  title: 'Display/DataGrid',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [rows, setRows] = useState<Person[]>(INITIAL);
      return (
        <div className="w-[40rem]">
          <DataGrid<Person>
            columns={[
              { key: 'name', header: 'Name', accessor: (r) => r.name, type: 'text' },
              { key: 'age', header: 'Age', accessor: (r) => r.age, type: 'number', align: 'right' },
              {
                key: 'role',
                header: 'Role',
                accessor: (r) => r.role,
                type: 'select',
                options: [
                  { value: 'admin', label: 'Admin' },
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Viewer' },
                ],
              },
              { key: 'active', header: 'Active', accessor: (r) => r.active, type: 'boolean', align: 'center' },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            onRowChange={(row, key, value) => {
              setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)),
              );
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Click a cell to edit · arrows to navigate · Enter to start, Tab → next column,
            Enter → next row, Escape → revert.
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Dense: Story = {
  render: () => (
    <div className="w-[36rem]">
      <DataGrid<Person>
        isDense
        columns={[
          { key: 'name', header: 'Name', accessor: (r) => r.name, isEditable: false },
          { key: 'age', header: 'Age', accessor: (r) => r.age, type: 'number', align: 'right' },
        ]}
        rows={INITIAL}
        rowKey={(r) => r.id}
      />
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: DataGrid.tsx source.
 * Click-to-edit defers one frame via requestAnimationFrame (findByRole absorbs
 * it); closing an editor refocuses the grid in a post-commit effect (waitFor).
 * Deferred by the component itself (not tested): range select, fill handle,
 * TSV paste, column resize/reorder, virtualization.
 * ------------------------------------------------------------------------- */

const interactionColumns: DataGridColumn<Person>[] = [
  { key: 'name', header: 'Name', accessor: (r) => r.name, type: 'text' },
  { key: 'age', header: 'Age', accessor: (r) => r.age, type: 'number', align: 'right' },
  {
    key: 'role',
    header: 'Role',
    accessor: (r) => r.role,
    type: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { key: 'active', header: 'Active', accessor: (r) => r.active, type: 'boolean', align: 'center' },
];

/** Stateful wrapper: forwards the spy AND applies edits so committed values render. */
function EditableFixture({
  onRowChange,
}: {
  onRowChange?: (row: Person, colKey: string, value: unknown) => void;
}) {
  const [rows, setRows] = useState<Person[]>(INITIAL);
  return (
    <div className="w-[40rem]">
      <DataGrid<Person>
        columns={interactionColumns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowChange={(row, colKey, value) => {
          onRowChange?.(row, colKey, value);
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [colKey]: value } : r)));
        }}
      />
    </div>
  );
}

const COLS = interactionColumns.length;
const cellAt = (canvas: ReturnType<typeof within>, row: number, col: number) =>
  canvas.getAllByRole('gridcell')[row * COLS + col]!;

interface RowChangeSpyArgs {
  onRowChange?: (row: Person, colKey: string, value: unknown) => void;
}
type SpyStory = StoryObj<RowChangeSpyArgs>;

export const ArrowKeysMoveActiveCell: Story = {
  render: () => <EditableFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');

    // The grid container is the tab stop; cell (0,0) starts active.
    await userEvent.tab();
    await expect(grid).toHaveFocus();
    await expect(cellAt(canvas, 0, 0)).toHaveAttribute('aria-selected', 'true');
    await expect(grid).toHaveAttribute('aria-activedescendant', cellAt(canvas, 0, 0).id);

    // Arrows move the active cell; aria-activedescendant tracks it.
    await userEvent.keyboard('{ArrowRight}');
    await expect(cellAt(canvas, 0, 1)).toHaveAttribute('aria-selected', 'true');
    await expect(cellAt(canvas, 0, 0)).not.toHaveAttribute('aria-selected');
    await expect(grid).toHaveAttribute('aria-activedescendant', cellAt(canvas, 0, 1).id);

    await userEvent.keyboard('{ArrowDown}');
    await expect(cellAt(canvas, 1, 1)).toHaveAttribute('aria-selected', 'true');

    // Home/End jump to the row edges.
    await userEvent.keyboard('{End}');
    await expect(cellAt(canvas, 1, 3)).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home}');
    await expect(cellAt(canvas, 1, 0)).toHaveAttribute('aria-selected', 'true');

    // Edges clamp instead of wrapping.
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowLeft}');
    await expect(cellAt(canvas, 0, 0)).toHaveAttribute('aria-selected', 'true');
  },
};

export const EnterEditsCommitsAndMovesDown: SpyStory = {
  args: { onRowChange: fn() },
  render: (args) => <EditableFixture onRowChange={args.onRowChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    // Editor opens seeded with the cell value, focused, text pre-selected.
    const input = await canvas.findByRole('textbox');
    await expect(input).toHaveValue('Alice');
    await waitFor(() => expect(input).toHaveFocus());

    // Typing replaces the selected text; Enter commits and moves active down.
    await userEvent.keyboard('Alicia{Enter}');
    await expect(args.onRowChange).toHaveBeenCalledTimes(1);
    await expect(args.onRowChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      'name',
      'Alicia',
    );
    await waitFor(() => expect(canvas.queryByRole('textbox')).not.toBeInTheDocument());
    await expect(cellAt(canvas, 0, 0)).toHaveTextContent('Alicia');
    await expect(cellAt(canvas, 1, 0)).toHaveAttribute('aria-selected', 'true');
    // Focus returns to the grid so keyboard nav stays alive.
    await waitFor(() => expect(grid).toHaveFocus());
  },
};

export const EscapeCancelsWithoutCommitting: SpyStory = {
  args: { onRowChange: fn() },
  render: (args) => <EditableFixture onRowChange={args.onRowChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const input = await canvas.findByRole('textbox');
    await waitFor(() => expect(input).toHaveFocus());

    await userEvent.keyboard('Zaphod');
    await expect(input).toHaveValue('Zaphod');

    // Escape reverts: editor closes, nothing committed, cell text unchanged.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('textbox')).not.toBeInTheDocument());
    await expect(args.onRowChange).not.toHaveBeenCalled();
    await expect(cellAt(canvas, 0, 0)).toHaveTextContent('Alice');

    // Grid regains focus — navigation still works after a cancel.
    await waitFor(() => expect(grid).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(cellAt(canvas, 1, 0)).toHaveAttribute('aria-selected', 'true');
  },
};

export const TabCommitsAndMovesRight: SpyStory = {
  args: { onRowChange: fn() },
  render: (args) => <EditableFixture onRowChange={args.onRowChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const input = await canvas.findByRole('textbox');
    await waitFor(() => expect(input).toHaveFocus());

    // Tab inside an editor is trapped by the grid: commit + move right.
    await userEvent.keyboard('Ada');
    await userEvent.tab();
    await expect(args.onRowChange).toHaveBeenCalledTimes(1);
    await expect(args.onRowChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      'name',
      'Ada',
    );
    await waitFor(() => expect(canvas.queryByRole('textbox')).not.toBeInTheDocument());
    await expect(cellAt(canvas, 0, 1)).toHaveAttribute('aria-selected', 'true');
  },
};

export const ClickBeginsEditAndBlurCommits: SpyStory = {
  args: { onRowChange: fn() },
  render: (args) => <EditableFixture onRowChange={args.onRowChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click puts the cell in edit mode (deferred one frame via rAF).
    await userEvent.click(cellAt(canvas, 0, 0));
    const input = await canvas.findByRole('textbox');
    await expect(input).toHaveValue('Alice');

    // Clicking another cell blurs the editor → commits the current draft, then
    // the clicked cell starts editing (age column → number editor).
    await userEvent.click(cellAt(canvas, 1, 1));
    await waitFor(() =>
      expect(args.onRowChange).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' }),
        'name',
        'Alice',
      ),
    );
    const ageInput = await canvas.findByRole('spinbutton');
    await expect(ageInput).toHaveValue(24);
    await expect(args.onRowChange).toHaveBeenCalledTimes(1);
  },
};

export const TypedEditorsCastCommittedValues: SpyStory = {
  args: { onRowChange: fn() },
  render: (args) => <EditableFixture onRowChange={args.onRowChange} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole('grid');

    // Number column commits a real number (castValue), not the raw string.
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}'); // (0,1) Age — Alice
    await userEvent.keyboard('{Enter}');
    const age = await canvas.findByRole('spinbutton');
    await expect(age).toHaveValue(30);
    await waitFor(() => expect(age).toHaveFocus());
    await userEvent.keyboard('29{Enter}');
    await expect(args.onRowChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '1' }),
      'age',
      29,
    );

    // Select column: picking an option commits immediately (no explicit Enter).
    await waitFor(() => expect(grid).toHaveFocus()); // commit moved active to (1,1)
    await userEvent.keyboard('{ArrowRight}'); // (1,2) Role — Bob
    await userEvent.keyboard('{Enter}');
    const role = await canvas.findByRole('combobox');
    await expect(role).toHaveValue('editor');
    await userEvent.selectOptions(role, 'viewer');
    await expect(args.onRowChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '2' }),
      'role',
      'viewer',
    );
    await waitFor(() => expect(canvas.queryByRole('combobox')).not.toBeInTheDocument());
    await expect(cellAt(canvas, 1, 2)).toHaveTextContent('viewer');

    // Boolean column: select editor commits a real boolean; read mode = ✓ / ·.
    await expect(cellAt(canvas, 2, 3)).toHaveTextContent('·'); // Carol inactive
    await waitFor(() => expect(grid).toHaveFocus()); // select commit moved active to (2,2)
    await userEvent.keyboard('{ArrowRight}'); // (2,3) Active — Carol
    await userEvent.keyboard('{Enter}');
    const bool = await canvas.findByRole('combobox');
    await expect(bool).toHaveValue('false');
    await userEvent.selectOptions(bool, 'true');
    await expect(args.onRowChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: '3' }),
      'active',
      true,
    );
    await waitFor(() => expect(cellAt(canvas, 2, 3)).toHaveTextContent('✓'));
  },
};

export const ReadOnlyColumnNeverEdits: Story = {
  render: () => (
    <div className="w-[36rem]">
      <DataGrid<Person>
        columns={[
          { key: 'name', header: 'Name', accessor: (r) => r.name, isEditable: false },
          { key: 'age', header: 'Age', accessor: (r) => r.age, type: 'number' },
        ]}
        rows={INITIAL}
        rowKey={(r) => r.id}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cells = canvas.getAllByRole('gridcell');
    const nameCell = cells[0]!;
    const ageCell = cells[1]!;

    // Read-only cell is marked for AT; the editable one is not.
    await expect(nameCell).toHaveAttribute('aria-readonly', 'true');
    await expect(ageCell).not.toHaveAttribute('aria-readonly');

    // Click and Enter both refuse to open an editor on the read-only cell…
    await userEvent.click(nameCell);
    await expect(nameCell).toHaveAttribute('aria-selected', 'true'); // still navigable
    await userEvent.keyboard('{Enter}');
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('spinbutton')).not.toBeInTheDocument();

    // …while the editable neighbour still edits fine.
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await expect(await canvas.findByRole('spinbutton')).toHaveValue(30);
  },
};
