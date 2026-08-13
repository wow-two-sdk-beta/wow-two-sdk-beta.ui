export { default as Tree, type TreeProps } from './Tree.vue';
/* React attached these as `Tree.Group` / `.Item` via `Object.assign`. An SFC's
   generated default export cannot carry statics cleanly, so they ship as siblings. */
export { default as TreeGroup, type TreeGroupProps } from './TreeGroup.vue';
export { default as TreeItem, type TreeItemProps } from './TreeItem.vue';
export {
  useTreeContext,
  useTreeLevel,
  type TreeContextValue,
  type TreeLevelValue,
} from './TreeContext';
