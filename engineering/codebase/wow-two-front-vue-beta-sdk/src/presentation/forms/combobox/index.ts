export { default as Combobox, type ComboboxProps } from './Combobox.vue';
/* React attached these as `Combobox.Input` / `.Content` / `.Item` / `.Group` / `.Separator` /
   `.Empty` via `Object.assign`. An SFC's generated default export cannot carry statics
   cleanly, so they ship as siblings. */
export { default as ComboboxInput, type ComboboxInputProps } from './ComboboxInput.vue';
export { default as ComboboxContent, type ComboboxContentProps } from './ComboboxContent.vue';
export { default as ComboboxItem, type ComboboxItemProps } from './ComboboxItem.vue';
export { default as ComboboxGroup, type ComboboxGroupProps } from './ComboboxGroup.vue';
export { default as ComboboxSeparator } from './ComboboxSeparator.vue';
export { default as ComboboxEmpty } from './ComboboxEmpty.vue';
export { useComboboxContext, type ComboboxContextValue, type ComboboxItemEntry } from './ComboboxContext';
