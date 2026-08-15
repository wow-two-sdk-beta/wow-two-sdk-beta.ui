export { default as ContextMenu, type ContextMenuProps } from './ContextMenu.vue';
/* React attached these as `ContextMenu.Trigger` / `.Content` via `Object.assign`
   (plus `.Item` / `.Group` / `.Label` / `.Separator` re-exported from `menu`). An
   SFC's generated default export cannot carry statics cleanly, so they ship as
   siblings; the menu parts are imported from `nav/menu` directly. */
export { default as ContextMenuTrigger, type ContextMenuTriggerProps } from './ContextMenuTrigger.vue';
export { default as ContextMenuContent, type ContextMenuContentProps } from './ContextMenuContent.vue';
export { contextMenuContextKey, useContextMenuContext, type ContextMenuContextValue } from './ContextMenuContext';
