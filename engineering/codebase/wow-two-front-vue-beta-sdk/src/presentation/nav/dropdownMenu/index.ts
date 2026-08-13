export { default as DropdownMenu, type DropdownMenuProps } from './DropdownMenu.vue';
/* React attached these as `DropdownMenu.Trigger` / `.Content` via `Object.assign`
   (plus `.Item` / `.Group` / `.Label` / `.Separator` re-exported from `menu`). An
   SFC's generated default export cannot carry statics cleanly, so they ship as
   siblings; the menu parts are imported from `nav/menu` directly. */
export {
  default as DropdownMenuTrigger,
  type DropdownMenuTriggerProps,
} from './DropdownMenuTrigger.vue';
export {
  default as DropdownMenuContent,
  type DropdownMenuContentProps,
} from './DropdownMenuContent.vue';
export {
  dropdownMenuContextKey,
  useDropdownMenuContext,
  type DropdownMenuContextValue,
} from './DropdownMenuContext';
