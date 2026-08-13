export { default as Menubar, type MenubarProps } from './Menubar.vue';
/* React attached these as `Menubar.Menu` / `.Trigger` / `.Content` via
   `Object.assign` (plus `.Item` / `.Group` / `.Label` / `.Separator` re-exported
   from `menu`). An SFC's generated default export cannot carry statics cleanly,
   so they ship as siblings; the menu parts are imported from `nav/menu` directly. */
export { default as MenubarMenu, type MenubarMenuProps } from './MenubarMenu.vue';
export { default as MenubarTrigger, type MenubarTriggerProps } from './MenubarTrigger.vue';
export { default as MenubarContent, type MenubarContentProps } from './MenubarContent.vue';
export {
  menubarContextKey,
  menubarMenuContextKey,
  useMenubarContext,
  useMenubarMenuContext,
  type MenubarContextValue,
  type MenubarMenuContextValue,
  type MenubarTriggerEntry,
} from './MenubarContext';
