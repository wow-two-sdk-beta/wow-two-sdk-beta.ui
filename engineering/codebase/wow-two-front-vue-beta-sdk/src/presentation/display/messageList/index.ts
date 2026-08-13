export {
  default as MessageList,
  type MessageListProps,
  type MessageListHandle,
} from './MessageList.vue';
/* React attached this as `MessageList.DaySeparator` via `Object.assign`. An SFC's
   generated default export cannot carry statics cleanly, so it ships as a sibling. */
export { default as DaySeparator, type DaySeparatorProps } from './DaySeparator.vue';
