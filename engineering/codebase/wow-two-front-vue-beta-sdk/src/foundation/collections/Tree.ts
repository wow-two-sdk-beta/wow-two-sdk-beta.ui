// Tree — turning the flat `{ id, parentId }` list an API returns into something a tree view can render,
// and walking it once it is nested.
//
// THE OUTPUT WRAPS, IT DOES NOT SPREAD. `buildTree` returns `TreeNode<T>` — `{ item, children }` — rather
// than `{ ...item, children }`. Spreading copies every row (wasteful on a large list), breaks referential
// equality against the source rows (so every memo downstream misses), and collides the moment a row has
// its own `children` field. The wrapper holds the ORIGINAL item reference.
//
// SERVER DATA IS NOT A TREE UNTIL PROVEN. Two malformed shapes arrive in practice and neither may throw or
// hang, because the alternative is a blank screen for one bad row:
//
//   1. ORPHAN — `parentId` names a row that is not in the list (deleted, or filtered out by paging). The
//      orphan is PROMOTED TO A ROOT. Dropping it would silently hide data; a root is visible and wrong in
//      a way a user can report.
//   2. CYCLE — a parent chain that loops (`a → b → c → a`, or a row that is its own parent). Every row ON
//      the cycle is PROMOTED TO A ROOT and its upward link is severed. Rows merely BELOW a cycle keep
//      their parent and nest normally under whichever cycle member became a root. Nothing is dropped and
//      every row appears exactly once. Detection is an explicit upward walk per row with an on-path set,
//      so it terminates by construction.
//
// The node builder additionally guards on the id currently being expanded. That is not redundant with the
// cycle detection above: it covers DUPLICATE ids, where two different rows claim the same id and the
// parent index can otherwise hand a row back to itself.
//
// `flattenTree` / `findInTree` take a `childrenKey` because a consumer's own nested shape (`items`,
// `nodes`, `subRows`) is as common as this slice's own, and both guard against a self-referential node so
// a hand-built structure cannot hang them either.

/** One node of a built tree — the source item plus the items that named it as parent. */
export interface TreeNode<T> {
  /** The source item, by reference — never a copy, so memo comparisons against the input still hit. */
  readonly item: T;
  /** The direct children, in the order the source list listed them. Empty for a leaf. */
  readonly children: ReadonlyArray<TreeNode<T>>;
}

/** The two accessors {@link buildTree} needs to read a flat list's parent/child relation. */
export interface BuildTreeOptions<T, TId> {
  /** Reads an item's own identity. */
  readonly id: (item: T) => TId;
  /** Reads the id of an item's parent, or a nullish value when the item is a root. */
  readonly parentId: (item: T) => TId | null | undefined;
}

/**
 * Nests a flat list into roots-with-children.
 *
 * Root order and sibling order both follow the input's order — no sorting happens here, deliberately.
 * Ordering a tree is `foundation/selection`'s job (`applySort` over the flat list before building, or over
 * a node's `children` after); a second comparator in this slice would let a tree order its rows
 * differently from the table beside it.
 *
 * Malformed input is tolerated, not rejected: an item whose parent is missing becomes a root, and an item
 * on a cyclic parent chain becomes a root with its upward link severed. Neither case drops an item, and
 * neither hangs. A duplicate id resolves to its first occurrence for parent lookups.
 *
 * @param items The flat list; never mutated, and its item references are reused in the result.
 * @param options The `id` / `parentId` accessors.
 * @returns A new array of root nodes.
 */
export function buildTree<T, TId>(
  items: readonly T[],
  options: BuildTreeOptions<T, TId>,
): TreeNode<T>[] {
  const { id, parentId } = options;

  const byId = new Map<TId, T>();
  for (const item of items) {
    const key = id(item);
    if (!byId.has(key)) byId.set(key, item);
  }

  const cyclicIds = detectCyclicIds(items, byId, id, parentId);

  const childrenById = new Map<TId, T[]>();
  const roots: T[] = [];
  for (const item of items) {
    const parent = parentId(item);
    const isRoot =
      parent === null || parent === undefined || !byId.has(parent) || cyclicIds.has(id(item));
    if (isRoot) {
      roots.push(item);
      continue;
    }
    const siblings = childrenById.get(parent);
    if (siblings) siblings.push(item);
    else childrenById.set(parent, [item]);
  }

  const expanding = new Set<TId>();
  const toNode = (item: T): TreeNode<T> => {
    const key = id(item);
    // Duplicate-id guard: a second row claiming an id already on the path would otherwise re-expand the
    // same child list forever. It renders as a leaf instead.
    if (expanding.has(key)) return { item, children: [] };
    expanding.add(key);
    const children = (childrenById.get(key) ?? []).map(toNode);
    expanding.delete(key);
    return { item, children };
  };

  return roots.map(toNode);
}

/**
 * Collects every id that sits ON a parent cycle. Walks upward from each item with an on-path set, so the
 * walk is bounded by the chain length and a loop is caught the moment it revisits an id.
 */
function detectCyclicIds<T, TId>(
  items: readonly T[],
  byId: ReadonlyMap<TId, T>,
  id: (item: T) => TId,
  parentId: (item: T) => TId | null | undefined,
): Set<TId> {
  const cyclicIds = new Set<TId>();
  for (const item of items) {
    const start = id(item);
    if (cyclicIds.has(start)) continue;

    const path: TId[] = [];
    const onPath = new Set<TId>();
    let currentId: TId | undefined = start;
    while (currentId !== undefined) {
      if (onPath.has(currentId)) {
        // Only the suffix from the revisited id onwards is the loop; anything before it merely leads in.
        const loopStart = path.indexOf(currentId);
        for (let index = loopStart; index < path.length; index += 1) {
          cyclicIds.add(path[index] as TId);
        }
        break;
      }
      const owner = byId.get(currentId);
      if (owner === undefined) break;
      onPath.add(currentId);
      path.push(currentId);
      currentId = parentId(owner) ?? undefined;
    }
  }
  return cyclicIds;
}

/** Reads a node's children under the configured key, treating anything non-array as "no children". */
function readChildren<TNode extends object>(
  node: TNode,
  childrenKey: PropertyKey,
): readonly TNode[] {
  const children = (node as Record<PropertyKey, unknown>)[childrenKey];
  return Array.isArray(children) ? (children as TNode[]) : [];
}

/**
 * Walks a nested structure depth-first, pre-order, into one flat list — parent before its children, which
 * is the order a collapsed/expanded tree view renders rows in.
 *
 * A node already visited is skipped, so a self-referential structure terminates and each node appears once.
 *
 * @param nodes The roots to walk; never mutated, and node references are reused in the result.
 * @param childrenKey The property holding a node's children; defaults to `'children'`.
 * @returns A new flat array of the same node objects.
 */
export function flattenTree<TNode extends object>(
  nodes: readonly TNode[],
  childrenKey: PropertyKey = 'children',
): TNode[] {
  const result: TNode[] = [];
  const visited = new Set<TNode>();
  const walk = (level: readonly TNode[]): void => {
    for (const node of level) {
      if (visited.has(node)) continue;
      visited.add(node);
      result.push(node);
      walk(readChildren(node, childrenKey));
    }
  };
  walk(nodes);
  return result;
}

/**
 * Finds the first node matching a predicate, depth-first, pre-order — the lookup behind "select the node
 * for this route" and "reveal the row with this id".
 *
 * @param nodes The roots to search.
 * @param predicate Receives each node and its 0-based depth.
 * @param childrenKey The property holding a node's children; defaults to `'children'`.
 * @returns The matching node, or `undefined` when nothing matches.
 */
export function findInTree<TNode extends object>(
  nodes: readonly TNode[],
  predicate: (node: TNode, depth: number) => boolean,
  childrenKey: PropertyKey = 'children',
): TNode | undefined {
  const visited = new Set<TNode>();
  const walk = (level: readonly TNode[], depth: number): TNode | undefined => {
    for (const node of level) {
      if (visited.has(node)) continue;
      visited.add(node);
      if (predicate(node, depth)) return node;
      const found = walk(readChildren(node, childrenKey), depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(nodes, 0);
}

/**
 * Rebuilds a {@link TreeNode} tree with every item transformed, keeping the shape and the order.
 *
 * Typed to this slice's node shape rather than a `childrenKey`, because the result has to BE a tree: a
 * generic nested object could not be reassembled without knowing which key to write back.
 *
 * @param nodes The roots to map; never mutated.
 * @param mapFn Produces the replacement item from the current item and its 0-based depth.
 * @returns A new tree of new nodes.
 */
export function mapTree<T, TResult>(
  nodes: readonly TreeNode<T>[],
  mapFn: (item: T, depth: number) => TResult,
): TreeNode<TResult>[] {
  const walk = (level: readonly TreeNode<T>[], depth: number): TreeNode<TResult>[] =>
    level.map((node) => ({
      item: mapFn(node.item, depth),
      children: walk(node.children, depth + 1),
    }));
  return walk(nodes, 0);
}
