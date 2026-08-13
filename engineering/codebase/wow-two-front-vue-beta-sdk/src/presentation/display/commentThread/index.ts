export { default as CommentThread, type CommentThreadProps } from './CommentThread.vue';
/* React attached this as `CommentThread.Comment` via `Object.assign`. An SFC's
   generated default export cannot carry statics cleanly, so it ships as a sibling. */
export { default as Comment, type CommentProps } from './Comment.vue';
