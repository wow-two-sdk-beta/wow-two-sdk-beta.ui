import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataGrid } from './DataGrid';

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
        dense
        columns={[
          { key: 'name', header: 'Name', accessor: (r) => r.name, editable: false },
          { key: 'age', header: 'Age', accessor: (r) => r.age, type: 'number', align: 'right' },
        ]}
        rows={INITIAL}
        rowKey={(r) => r.id}
      />
    </div>
  ),
};
