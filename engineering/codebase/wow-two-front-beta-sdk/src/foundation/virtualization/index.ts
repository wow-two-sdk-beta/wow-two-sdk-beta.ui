// virtualization — foundation seam. Render a 100k-row list by mounting the ~20 rows that are actually on screen:
// the pure windowing math (`computeRange` / `computeScrollOffset` over a prefix-sum `Measurements` model) and
// the `useVirtualList` hook that binds it to a real scroll container. Replaces the "just render everything and
// hope" lists and the hand-rolled `slice(start, end)` windows that drift out of sync with the scrollbar.
//
// HOUSE RULES, which consumers should follow too:
//
//  - HEADLESS. Nothing here renders, and nothing here has an opinion about markup. It returns numbers; the
//    consumer owns the DOM. That is what lets the same hook drive a table body, a chat log, and a grid.
//
//  - THE MATH IS PURE AND SEPARATELY TESTABLE. `computeRange` is arithmetic over plain numbers, exercised in
//    the node project; only the scroll/resize plumbing needs a browser. New windowing behaviour belongs in
//    `Windowing`/`Measurements`, where it can be proven without a layout engine.
//
//  - O(log n) OR IT DOES NOT SHIP. Item lookup is a binary search over cumulative offsets, never a scan. A
//    linear pass runs on every scroll frame and is the exact cost this seam exists to remove.
//
//  - MEASURE UPWARDS, ANCHOR THE VIEW. `measureItem` is how estimates become truth. When a re-measured item
//    sits above the fold the hook corrects the scroll position by the same delta, so the content under the
//    user's eyes does not move. Consumers get that for free — but only if they size the spacer from
//    `totalSize`, which is what gives the container room to hold the corrected offset.
//
// COMPOSES WITH `foundation/primitives`' `ScrollViewport`: that primitive IS the scroll container this hook
// watches — it owns the clipping, the fixed/max height, and the stable scrollbar gutter, and its `forwardRef`
// exposes the scrollable node. Pass that same ref as `target`. They are two halves of one list and neither
// duplicates the other: `ScrollViewport` never windows, `useVirtualList` never renders a box.
//
// USAGE SKETCH — absolute positioning inside a `totalSize` spacer:
//
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const { virtualItems, totalSize } = useVirtualList({
//     count: rows.length,
//     estimateSize: () => 48,
//     target: scrollRef,
//   });
//
//   <ScrollViewport ref={scrollRef} height={480}>
//     <div style={{ height: totalSize, position: 'relative' }}>
//       {virtualItems.map((item) => (
//         <div
//           key={item.key}
//           style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
//         >
//           {renderRow(rows[item.index])}
//         </div>
//       ))}
//     </div>
//   </ScrollViewport>
//
// For rows whose height is not known up front, measure each one and feed it back — `measureItem(item.index, h)`
// from a `ResizeObserver` or a layout effect. It is a no-op when the size is unchanged, so it is safe per commit.
// Consumers preferring spacer divs over absolute positioning can render `paddingStart` / `paddingEnd` instead.
//
// NOT HERE, on purpose:
//  - `useResizeObserver` — it lives in `foundation/hooks` and is not re-exported; one export site per hook.
//  - The scroll container itself — that is `foundation/primitives`' `ScrollViewport` (see above).
//  - Grid/2D windowing, sticky headers, and infinite-scroll paging — this is the primitive they would build on.

export {
  buildMeasurements,
  findIndexAtOffset,
  findIndexByOffsetAccessor,
  itemOffset,
  itemSize,
  measurementsTotalSize,
  withMeasuredSize,
  EMPTY_MEASUREMENTS,
  type Measurements,
} from './Measurements';

export {
  computeRange,
  computeScrollOffset,
  DEFAULT_OVERSCAN,
  EMPTY_RANGE,
  type ComputeRangeOptions,
  type ComputeScrollOffsetOptions,
  type ScrollAlignment,
  type VirtualRange,
} from './Windowing';

export {
  useVirtualList,
  type UseVirtualListOptions,
  type VirtualItem,
  type VirtualList,
} from './UseVirtualList';
