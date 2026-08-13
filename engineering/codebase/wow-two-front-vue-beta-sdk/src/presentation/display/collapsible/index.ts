export { default as Collapsible, type CollapsibleProps } from './Collapsible.vue';
/* React attached these as `Collapsible.Trigger` / `.Content` via `Object.assign`. An SFC's
   generated default export cannot carry statics cleanly, so they ship as siblings — the
   same shape every other compound family in this group uses. */
export {
  default as CollapsibleTrigger,
  type CollapsibleTriggerProps,
} from './CollapsibleTrigger.vue';
export {
  default as CollapsibleContent,
  type CollapsibleContentProps,
} from './CollapsibleContent.vue';
export {
  CollapsibleKey,
  useCollapsibleContext,
  type CollapsibleContextValue,
} from './CollapsibleContext';
