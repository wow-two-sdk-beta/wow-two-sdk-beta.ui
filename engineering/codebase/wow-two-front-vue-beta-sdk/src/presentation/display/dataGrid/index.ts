export { default as DataGrid, type DataGridProps } from './DataGrid.vue';
/* React declared these beside the component; here they sit in a sibling module so
   the private `CellEditor.vue` can share them. The exported surface is unchanged —
   `DataGridMove` stays internal, exactly as it was in `DataGrid.tsx`. */
export {
  DataGridCellType,
  DataGridColumnAlign,
  type DataGridColumn,
} from './DataGridTypes';
