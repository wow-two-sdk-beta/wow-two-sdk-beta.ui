export { default as List, type ListProps } from './List.vue';
/* React attached this as `List.Item` via `Object.assign`. An SFC's generated default
   export cannot carry statics cleanly, so it ships as a sibling — the same shape every
   other compound family in this group uses. */
export { default as ListItem, type ListItemProps } from './ListItem.vue';
export { listVariants, ListMarker, ListSpacing, type ListVariants } from './List.variants';
