export { default as MultiSelect, type MultiSelectProps } from './MultiSelect.vue';
/* React attached these as `MultiSelect.Trigger` / `.Tags` / `.Content` / `.Item` via
   `Object.assign`. An SFC's generated default export cannot carry statics cleanly, so they
   ship as siblings. `MultiSelect.Group` / `.Separator` / `.Empty` were re-exports of the
   Listbox parts — import those from `forms/listbox` directly. */
export {
  default as MultiSelectTrigger,
  type MultiSelectTriggerProps,
} from './MultiSelectTrigger.vue';
export { default as MultiSelectTags, type MultiSelectTagsProps } from './MultiSelectTags.vue';
export {
  default as MultiSelectContent,
  type MultiSelectContentProps,
} from './MultiSelectContent.vue';
export { default as MultiSelectItem, type MultiSelectItemProps } from './MultiSelectItem.vue';
export { useMultiSelectContext, type MultiSelectContextValue } from './MultiSelectContext';
