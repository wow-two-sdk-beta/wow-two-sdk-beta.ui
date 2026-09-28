import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, nextTick, type Component } from 'vue';
import { LocaleProvider } from '@src/foundation/i18n';
import { DataTable, type DataTableColumn } from '@src/presentation/display';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

const people: ReadonlyArray<Person> = [
  { id: 'p1', name: 'Cleo', age: 41 },
  { id: 'p2', name: 'Ada', age: 36 },
  { id: 'p3', name: 'Bo', age: 29 },
  { id: 'p4', name: 'Dev', age: 52 },
];

const columns: ReadonlyArray<DataTableColumn<Person>> = [
  { key: 'name', header: 'Name', accessor: (row) => row.name, isSortable: true },
  { key: 'age', header: 'Age', accessor: (row) => row.age },
];

const wrappers: VueWrapper[] = [];
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  document.body.innerHTML = '';
});

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}): VueWrapper {
  const wrapper = mount(DataTable as unknown as Component, {
    props: { columns, data: people, rowKey: (row: Person) => row.id, ...props },
    slots,
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

function bodyRows(wrapper: VueWrapper): HTMLTableRowElement[] {
  return [...(wrapper.element as HTMLElement).querySelectorAll<HTMLTableRowElement>('tbody tr')].filter(
    (row) => !row.hasAttribute('data-detail-row'),
  );
}

function rowCheckbox(wrapper: VueWrapper, index: number): HTMLInputElement {
  return bodyRows(wrapper)[index]!.querySelector<HTMLInputElement>('input[type=checkbox]')!;
}

function headerCheckbox(wrapper: VueWrapper): HTMLInputElement | null {
  return (wrapper.element as HTMLElement).querySelector<HTMLInputElement>('thead input[type=checkbox]');
}

/** Toggles a checkbox the way a pointer does, optionally holding Shift. */
async function press(checkbox: HTMLInputElement, init: MouseEventInit = {}): Promise<void> {
  const wasChecked = checkbox.checked;
  checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
  if (checkbox.checked === wasChecked) {
    checkbox.checked = !wasChecked;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }
  await nextTick();
}

function lastSelection(wrapper: VueWrapper): unknown {
  return wrapper.emitted('update:selection')?.at(-1)?.[0];
}

describe('DataTable selection', () => {
  it('selects rows, reflects the header tri-state and selects all', async () => {
    const wrapper = mountTable({ selectionMode: 'multiple' });
    expect(headerCheckbox(wrapper)!.getAttribute('aria-label')).toBe('Select all rows');
    await press(rowCheckbox(wrapper, 1));
    expect(lastSelection(wrapper)).toEqual(['p2']);
    expect(bodyRows(wrapper)[1]!.getAttribute('aria-selected')).toBe('true');
    expect(headerCheckbox(wrapper)!.indeterminate).toBe(true);
    await press(headerCheckbox(wrapper)!);
    expect(lastSelection(wrapper)).toEqual(['p2', 'p1', 'p3', 'p4']);
    await press(headerCheckbox(wrapper)!);
    expect(lastSelection(wrapper)).toEqual([]);
  });

  it('selects the shift range in display order after sorting', async () => {
    const wrapper = mountTable({ selectionMode: 'multiple', defaultSortBy: { columnKey: 'name', direction: 'asc' } });
    expect(bodyRows(wrapper).map((row) => row.textContent)).toEqual(['Ada36', 'Bo29', 'Cleo41', 'Dev52']);
    await press(rowCheckbox(wrapper, 0));
    await press(rowCheckbox(wrapper, 2), { shiftKey: true });
    expect(new Set(lastSelection(wrapper) as string[])).toEqual(new Set(['p2', 'p3', 'p1']));
  });

  it('keeps unselectable rows out of select-all and replaces the pick in single mode', async () => {
    const multiple = mountTable({ selectionMode: 'multiple', isRowSelectable: (row: Person) => row.age < 50 });
    expect(rowCheckbox(multiple, 3).disabled).toBe(true);
    await press(headerCheckbox(multiple)!);
    expect(lastSelection(multiple)).toEqual(['p1', 'p2', 'p3']);
    const single = mountTable({ selectionMode: 'single' });
    expect(headerCheckbox(single)).toBeNull();
    await press(rowCheckbox(single, 0));
    await press(rowCheckbox(single, 2));
    expect(lastSelection(single)).toEqual(['p3']);
    await press(rowCheckbox(single, 2));
    expect(lastSelection(single)).toEqual([]);
  });

  it('keys rows by their data index without a rowKey, so sorting keeps identities', async () => {
    const wrapper = mountTable({
      rowKey: undefined,
      selectionMode: 'multiple',
      defaultSortBy: { columnKey: 'name', direction: 'asc' },
    });
    await press(rowCheckbox(wrapper, 0));
    expect(lastSelection(wrapper)).toEqual([1]);
  });

  it('requests changes without applying them while controlled and never fires a row click', async () => {
    const onRowClick = vi.fn();
    const wrapper = mountTable({ selectionMode: 'multiple', selection: ['p1'], onRowClick });
    await press(rowCheckbox(wrapper, 1));
    expect(lastSelection(wrapper)).toEqual(['p1', 'p2']);
    expect(rowCheckbox(wrapper, 1).checked).toBe(false);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});

describe('DataTable expansion, pinning and loading', () => {
  it('expands a detail row from its toggle and names it', async () => {
    const wrapper = mountTable(
      { isRowExpandable: (row: Person) => row.id !== 'p4' },
      { expanded: ({ row }: { row: Person }) => h('p', { 'data-detail': '' }, `Profile of ${row.name}`) },
    );
    const toggles = wrapper.findAll('tbody button[aria-expanded]');
    expect(toggles).toHaveLength(3);
    await toggles[0]!.trigger('click');
    const detail = wrapper.get('[data-detail-row]');
    expect(detail.text()).toBe('Profile of Cleo');
    expect(toggles[0]!.attributes('aria-expanded')).toBe('true');
    expect(toggles[0]!.attributes('aria-controls')).toBe(detail.attributes('id'));
    expect(wrapper.emitted('update:expanded')).toEqual([[['p1']]]);
    expect(wrapper.get('thead th').text()).toBe('Details');
  });

  it('pins the header and sizes the scroll container', () => {
    const wrapper = mountTable({ hasStickyHeader: true, containerClassName: 'max-h-60' });
    expect(wrapper.get('thead').classes()).toEqual(expect.arrayContaining(['sticky', 'top-0']));
    expect(wrapper.element.querySelector('table')!.parentElement!.classList.contains('max-h-60')).toBe(true);
  });

  it('draws skeleton rows while an empty table loads and keeps rows while a full one refreshes', async () => {
    const wrapper = mountTable({ data: [], isLoading: true, loadingRowCount: 3 });
    expect(wrapper.element.querySelectorAll('[data-skeleton-row]')).toHaveLength(3);
    expect(wrapper.element.querySelector('table')!.getAttribute('aria-busy')).toBe('true');
    expect(wrapper.text()).not.toContain('No results.');
    await wrapper.setProps({ data: people });
    expect(wrapper.element.querySelectorAll('[data-skeleton-row]')).toHaveLength(0);
    expect(bodyRows(wrapper)).toHaveLength(4);
    await wrapper.setProps({ isLoading: false });
    expect(wrapper.element.querySelector('table')!.hasAttribute('aria-busy')).toBe(false);
  });

  it('localizes the control column labels', () => {
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            LocaleProvider,
            { messages: { 'DataTable.selectAll': 'Alle auswählen', 'DataTable.expandRow': 'Mehr' } },
            () =>
              h(
                DataTable as unknown as Component,
                { columns, data: people, rowKey: (row: Person) => row.id, selectionMode: 'multiple' },
                { expanded: () => 'detail' },
              ),
          ),
      }),
      { attachTo: document.body },
    );
    wrappers.push(wrapper);
    expect(wrapper.get('thead input[type=checkbox]').attributes('aria-label')).toBe('Alle auswählen');
    expect(wrapper.get('tbody button[aria-expanded]').attributes('aria-label')).toBe('Mehr');
  });
});
