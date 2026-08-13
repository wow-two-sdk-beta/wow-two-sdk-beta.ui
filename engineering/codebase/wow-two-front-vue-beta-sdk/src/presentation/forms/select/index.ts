export { default as Select, type SelectProps } from './Select.vue';
export { default as SelectTrigger, type SelectTriggerProps } from './SelectTrigger.vue';
export { default as SelectValue, type SelectValueProps } from './SelectValue.vue';
export { default as SelectContent, type SelectContentProps } from './SelectContent.vue';
export { default as SelectItem, type SelectItemProps } from './SelectItem.vue';
export { type SelectOption } from './SelectContext';
export { selectTriggerVariants, SelectSize, type SelectTriggerVariants } from './Select.variants';

/* React attached the compound namespace via `Object.assign` (`Select.Trigger`, `Select.Group`,
   …); the landed Vue convention is flat named siblings. `Select.Group` / `.Separator` / `.Empty`
   were re-exports of the Listbox parts — import those from `forms/listbox` directly. */
