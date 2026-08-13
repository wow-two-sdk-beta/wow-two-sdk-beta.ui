export { default as Menu, type MenuProps } from './Menu.vue';
/* React attached these as `Menu.Item` / `.Group` / `.Label` / `.Separator` via
   `Object.assign`. An SFC's generated default export cannot carry statics
   cleanly, so they ship as siblings. */
export { default as MenuItem, type MenuItemProps } from './MenuItem.vue';
export { default as MenuGroup, type MenuGroupProps } from './MenuGroup.vue';
export { default as MenuLabel } from './MenuLabel.vue';
export { default as MenuSeparator } from './MenuSeparator.vue';
export { MenuKey, useMenuContext, type MenuContextValue, type MenuItemEntry } from './MenuContext';
export {
  menuVariants,
  menuItemVariants,
  menuLabelVariants,
  menuSeparatorVariants,
  MenuItemState,
  type MenuVariants,
  type MenuItemVariants,
} from './Menu.variants';
