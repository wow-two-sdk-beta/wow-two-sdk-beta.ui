export { default as CommandPalette, type CommandPaletteProps } from './CommandPalette.vue';
/* React attached these as `CommandPalette.Content` / `.Input` / `.List` / … via
   `Object.assign`. An SFC's generated default export cannot carry statics
   cleanly, so they ship as siblings. */
export { default as CommandPaletteContent, type CommandPaletteContentProps } from './CommandPaletteContent.vue';
export { default as CommandPaletteInput, type CommandPaletteInputProps } from './CommandPaletteInput.vue';
export { default as CommandPaletteList, type CommandPaletteListProps } from './CommandPaletteList.vue';
export { default as CommandPaletteGroup, type CommandPaletteGroupProps } from './CommandPaletteGroup.vue';
export { default as CommandPaletteItem, type CommandPaletteItemProps } from './CommandPaletteItem.vue';
export { default as CommandPaletteEmpty, type CommandPaletteEmptyProps } from './CommandPaletteEmpty.vue';
export { default as CommandPaletteSeparator } from './CommandPaletteSeparator.vue';
export {
  commandPaletteContextKey,
  defaultFilter,
  useCommandPaletteContext,
  type CommandPaletteContextValue,
  type CommandItemEntry,
} from './CommandPaletteContext';
