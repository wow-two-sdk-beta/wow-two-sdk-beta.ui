import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Temporal } from 'temporal-polyfill';
import { DataTable, type DataTableColumn, type DataTableSort } from '@src/presentation/display/dataTable/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Temporal.PlainDate;
}

const USERS: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin', joinedAt: Temporal.PlainDate.from('2024-01-15') },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor', joinedAt: Temporal.PlainDate.from('2024-03-22') },
  { id: '3', name: 'Carol', email: 'carol@example.com', role: 'viewer', joinedAt: Temporal.PlainDate.from('2024-05-10') },
  { id: '4', name: 'Dan', email: 'dan@example.com', role: 'editor', joinedAt: Temporal.PlainDate.from('2024-07-04') },
];

const meta: Meta = {
  title: 'Display/DataTable',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DataTable<User>
      columns={[
        { key: 'name', header: 'Name', accessor: (r) => r.name, isSortable: true },
        { key: 'email', header: 'Email', accessor: (r) => r.email, isSortable: true },
        {
          key: 'role',
          header: 'Role',
          accessor: (r) => r.role,
          isSortable: true,
          cell: (r) => (
            <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-xs">
              {r.role}
            </span>
          ),
        },
        {
          key: 'joinedAt',
          header: 'Joined',
          accessor: (r) => r.joinedAt,
          cell: (r) => r.joinedAt.toLocaleString(),
          isSortable: true,
          align: 'right',
        },
      ]}
      data={USERS}
      rowKey={(r) => r.id}
      onRowClick={(r) => alert(`Clicked ${r.name}`)}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable<User>
      columns={[
        { key: 'name', header: 'Name', accessor: (r) => r.name },
        { key: 'email', header: 'Email', accessor: (r) => r.email },
      ]}
      data={[]}
      rowKey={(r) => r.id}
    />
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: DataTable.tsx source.
 * DataTable is sort + render only (no selection / pagination / filtering
 * implemented), and fully synchronous — no animations, so assertions can
 * follow the events directly.
 * ------------------------------------------------------------------------- */

interface Employee {
  id: string;
  name: string;
  score: number;
  team: string;
}

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Carol', score: 22, team: 'Core' },
  { id: 'e2', name: 'Alice', score: 8, team: 'Infra' },
  { id: 'e3', name: 'Eve', score: 41, team: 'Core' },
  { id: 'e4', name: 'Bob', score: 105, team: 'Web' },
  { id: 'e5', name: 'Dan', score: 30, team: 'Web' },
];

const employeeColumns: DataTableColumn<Employee>[] = [
  { key: 'name', header: 'Name', accessor: (r) => r.name, isSortable: true },
  { key: 'score', header: 'Score', accessor: (r) => r.score, isSortable: true, align: 'right' },
  { key: 'team', header: 'Team', accessor: (r) => r.team },
];

/** First-column text of every data row (header row sliced off) — the row-order oracle. */
const namesInOrder = (canvas: ReturnType<typeof within>) =>
  canvas
    .getAllByRole('row')
    .slice(1)
    .map((row: HTMLElement) => within(row).getAllByRole('cell')[0]!.textContent);

interface SortSpyArgs {
  onSortChange?: (sort: DataTableSort | null) => void;
}

interface RowClickSpyArgs {
  onRowClick?: (row: Employee, index: number) => void;
}

export const SortCycleAscDescNone: StoryObj<SortSpyArgs> = {
  args: { onSortChange: fn() },
  render: (args) => (
    <DataTable<Employee>
      columns={employeeColumns}
      data={EMPLOYEES}
      rowKey={(r) => r.id}
      onSortChange={args.onSortChange}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nameHeader = canvas.getByRole('columnheader', { name: 'Name' });
    const sortButton = within(nameHeader).getByRole('button');

    // Unsorted: sortable column advertises aria-sort="none", data in given order.
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    await expect(namesInOrder(canvas)).toEqual(['Carol', 'Alice', 'Eve', 'Bob', 'Dan']);

    // 1st click → ascending.
    await userEvent.click(sortButton);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(namesInOrder(canvas)).toEqual(['Alice', 'Bob', 'Carol', 'Dan', 'Eve']);
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ columnKey: 'name', direction: 'asc' });

    // 2nd click → descending.
    await userEvent.click(sortButton);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(namesInOrder(canvas)).toEqual(['Eve', 'Dan', 'Carol', 'Bob', 'Alice']);
    await expect(args.onSortChange).toHaveBeenLastCalledWith({ columnKey: 'name', direction: 'desc' });

    // 3rd click → cleared: original order restored, change reported as null.
    await userEvent.click(sortButton);
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    await expect(namesInOrder(canvas)).toEqual(['Carol', 'Alice', 'Eve', 'Bob', 'Dan']);
    await expect(args.onSortChange).toHaveBeenLastCalledWith(null);
    await expect(args.onSortChange).toHaveBeenCalledTimes(3);
  },
};

export const SortSwitchesColumnAndComparesNumbers: Story = {
  render: () => (
    <DataTable<Employee> columns={employeeColumns} data={EMPLOYEES} rowKey={(r) => r.id} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameHeader = canvas.getByRole('columnheader', { name: 'Name' });
    const scoreHeader = canvas.getByRole('columnheader', { name: 'Score' });

    await userEvent.click(within(nameHeader).getByRole('button'));
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Clicking another sortable column starts it at ascending (not descending)
    // and releases the previous column back to "none".
    await userEvent.click(within(scoreHeader).getByRole('button'));
    await expect(scoreHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // Numeric compare: 8 < 22 < 30 < 41 < 105 (string sort would order 105 first, 8 last).
    await expect(namesInOrder(canvas)).toEqual(['Alice', 'Carol', 'Dan', 'Eve', 'Bob']);
  },
};

export const RowClickReportsRowAndSortedIndex: StoryObj<RowClickSpyArgs> = {
  args: { onRowClick: fn() },
  render: (args) => (
    <DataTable<Employee>
      columns={employeeColumns}
      data={EMPLOYEES}
      rowKey={(r) => r.id}
      defaultSortBy={{ columnKey: 'name', direction: 'asc' }}
      onRowClick={args.onRowClick}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // defaultSortBy pre-sorts on mount (uncontrolled initial sort).
    await expect(canvas.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await expect(namesInOrder(canvas)).toEqual(['Alice', 'Bob', 'Carol', 'Dan', 'Eve']);

    // Callback receives the row object plus its index in the SORTED view:
    // Carol is data[0] but sorted row 2.
    const carolRow = canvas.getAllByRole('row')[3]!; // header + Alice + Bob → Carol
    await userEvent.click(within(carolRow).getAllByRole('cell')[0]!);
    await expect(args.onRowClick).toHaveBeenCalledTimes(1);
    await expect(args.onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'e1', name: 'Carol' }),
      2,
    );
  },
};

export const HeaderSortIsKeyboardOperable: Story = {
  render: () => (
    <DataTable<Employee> columns={employeeColumns} data={EMPLOYEES} rowKey={(r) => r.id} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nameHeader = canvas.getByRole('columnheader', { name: 'Name' });
    const sortButton = within(nameHeader).getByRole('button');

    // The sort control is a real <button>: first tab stop, Enter activates it.
    await userEvent.tab();
    await expect(sortButton).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(namesInOrder(canvas)).toEqual(['Alice', 'Bob', 'Carol', 'Dan', 'Eve']);

    // Non-sortable column renders a plain header — no button, no aria-sort.
    const teamHeader = canvas.getByRole('columnheader', { name: 'Team' });
    await expect(within(teamHeader).queryByRole('button')).not.toBeInTheDocument();
    await expect(teamHeader).not.toHaveAttribute('aria-sort');
  },
};

export const EmptyStateSpansAllColumns: Story = {
  render: () => (
    <DataTable<Employee>
      columns={employeeColumns}
      data={[]}
      rowKey={(r) => r.id}
      emptyContent="No employees yet."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Headers stay; the body collapses to a single full-width empty cell.
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(3);
    const emptyCell = canvas.getByRole('cell', { name: 'No employees yet.' });
    await expect(emptyCell).toHaveAttribute('colspan', '3');
    await expect(canvas.getAllByRole('row')).toHaveLength(2); // header row + empty row
  },
};
