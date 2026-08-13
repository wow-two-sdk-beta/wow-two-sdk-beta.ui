export { default as ActivityFeed, type ActivityFeedProps } from './ActivityFeed.vue';
/* React attached this as `ActivityFeed.Item` via `Object.assign`. An SFC's generated
   default export cannot carry statics cleanly, so it ships as a sibling. */
export { default as ActivityItem, type ActivityItemProps } from './ActivityItem.vue';
