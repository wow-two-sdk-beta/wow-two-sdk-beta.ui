// @wow-two-beta/ui/feedback — headless feedback bus. App code publishes notices
// (`notify({ tone, title })` on the default bus, or `createFeedbackBus()` for isolation) and a
// presentation adapter renders them — `<FeedbackToasts/>` (`/presentation/feedback`) forwards each
// notice into the imperative `toast()` API. `feedbackQueryErrors()` produces the callback for the
// `/query` global error seam (`createQueryClient({ onError: feedbackQueryErrors() })`), coercing
// `ApiError` → danger notice with the problem-details title; the bridge lives HERE so `/query`
// never depends on the bus. GWDNBM: pure fire-and-forget pub/sub, nothing auto-subscribes, no
// replay — every wire is explicit opt-in. This subpath carries NO peer dependency (React types +
// `foundation` only) and NO UI — mirrors `/auth`'s standalone, presentation-free shape.

// Bus — notice model, hub factory, default singleton
export {
  NoticeTone,
  createFeedbackBus,
  feedbackBus,
  notify,
  type FeedbackNotice,
  type PublishedNotice,
  type NoticeListener,
  type FeedbackBus,
} from './FeedbackBus';

// Query bridge — plugs the bus into `createQueryClient({ onError })`
export { feedbackQueryErrors, toErrorNotice } from './FeedbackQueryErrors';
