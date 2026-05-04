import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronRight } from 'lucide-react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { RovingFocusGroup, useRovingFocusItem } from '../../primitives';

interface TreeContextValue {
  selectedValue: string | null;
  setSelectedValue: (value: string) => void;
  expanded: Set<string>;
  toggleExpanded: (value: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

function useTreeContext() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('Tree.* must be used inside <Tree>');
  return ctx;
}

interface TreeLevelContextValue {
  level: number;
}

const TreeLevelContext = createContext<TreeLevelContextValue>({ level: 1 });

function useTreeLevel() {
  return useContext(TreeLevelContext).level;
}

export interface TreeProps extends Omit<HTMLAttributes<HTMLUListElement>, 'defaultValue'> {
  selectedValue?: string | null;
  defaultSelectedValue?: string | null;
  onSelectionChange?: (value: string) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (values: string[]) => void;
}

export const Tree = forwardRef<HTMLUListElement, TreeProps>(function Tree(
  {
    selectedValue,
    defaultSelectedValue,
    onSelectionChange,
    expanded,
    defaultExpanded,
    onExpandedChange,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [selected, setSelected] = useControlled<string | null>({
    controlled: selectedValue,
    default: defaultSelectedValue ?? null,
    onChange: onSelectionChange as ((v: string | null) => void) | undefined,
  });
  const [expandedList, setExpandedList] = useControlled<string[]>({
    controlled: expanded,
    default: defaultExpanded ?? [],
    onChange: onExpandedChange,
  });

  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);

  const toggleExpanded = useCallback(
    (value: string) => {
      const next = new Set(expandedSet);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      setExpandedList(Array.from(next));
    },
    [expandedSet, setExpandedList],
  );

  const ctx = useMemo<TreeContextValue>(
    () => ({
      selectedValue: selected,
      setSelectedValue: setSelected,
      expanded: expandedSet,
      toggleExpanded,
    }),
    [selected, setSelected, expandedSet, toggleExpanded],
  );

  return (
    <TreeContext.Provider value={ctx}>
      <RovingFocusGroup
        ref={ref as never}
        orientation="vertical"
        loop
        role="tree"
        className={cn('flex flex-col text-sm', className)}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </RovingFocusGroup>
    </TreeContext.Provider>
  );
});

interface NodeRowProps {
  level: number;
  selected: boolean;
  expanded?: boolean;
  hasChildren: boolean;
  disabled: boolean;
  onActivate: () => void;
  label: ReactNode;
}

function NodeRow({
  level,
  selected,
  expanded,
  hasChildren,
  disabled,
  onActivate,
  label,
}: NodeRowProps) {
  const roving = useRovingFocusItem();
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      roving.onKeyDown(e);
      if (e.defaultPrevented || disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
    [roving, disabled, onActivate],
  );
  return (
    <div
      ref={roving.ref as never}
      role="treeitem"
      aria-level={level}
      aria-selected={selected || undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-disabled={disabled || undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      tabIndex={roving.tabIndex}
      onFocus={roving.onFocus}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (!disabled) onActivate();
      }}
      style={{ paddingLeft: `${(level - 1) * 16}px` }}
      className={cn(
        'flex cursor-pointer items-center gap-1 rounded-sm px-2 py-1 transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'bg-primary-soft text-primary-soft-foreground',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {hasChildren ? (
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
    </div>
  );
}

export interface TreeGroupProps extends HTMLAttributes<HTMLLIElement> {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

export const TreeGroup = forwardRef<HTMLLIElement, TreeGroupProps>(function TreeGroup(
  { value, label, disabled = false, className, children, ...rest },
  ref,
) {
  const ctx = useTreeContext();
  const level = useTreeLevel();
  const expanded = ctx.expanded.has(value);

  return (
    <li
      ref={ref}
      role="presentation"
      data-state={expanded ? 'open' : 'closed'}
      className={cn('list-none', className)}
      {...rest}
    >
      <NodeRow
        level={level}
        selected={false}
        expanded={expanded}
        hasChildren
        disabled={disabled}
        onActivate={() => ctx.toggleExpanded(value)}
        label={label}
      />
      {expanded && (
        <TreeLevelContext.Provider value={{ level: level + 1 }}>
          <ul role="group" className="flex flex-col">
            {children}
          </ul>
        </TreeLevelContext.Provider>
      )}
    </li>
  );
});

export interface TreeItemProps extends HTMLAttributes<HTMLLIElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export const TreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function TreeItem(
  { value, disabled = false, className, children, ...rest },
  ref,
) {
  const ctx = useTreeContext();
  const level = useTreeLevel();
  const selected = ctx.selectedValue === value;

  return (
    <li ref={ref} role="presentation" className={cn('list-none', className)} {...rest}>
      <NodeRow
        level={level}
        selected={selected}
        hasChildren={false}
        disabled={disabled}
        onActivate={() => ctx.setSelectedValue(value)}
        label={children}
      />
    </li>
  );
});

type TreeComponent = typeof Tree & {
  Group: typeof TreeGroup;
  Item: typeof TreeItem;
};

(Tree as TreeComponent).Group = TreeGroup;
(Tree as TreeComponent).Item = TreeItem;

export default Tree as TreeComponent;
