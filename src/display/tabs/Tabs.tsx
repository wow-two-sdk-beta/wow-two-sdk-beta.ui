import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { RovingFocusGroup, useRovingFocusItem } from '../../primitives';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
  activationMode: 'automatic' | 'manual';
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    className,
    children,
    ...rest
  },
  ref,
) {
  const [active, setActive] = useControlled<string>({
    controlled: value,
    default: defaultValue ?? '',
    onChange: onValueChange,
  });
  const baseId = useId();

  const ctx = useMemo<TabsContextValue>(
    () => ({ value: active, setValue: setActive, orientation, activationMode, baseId }),
    [active, setActive, orientation, activationMode, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={ref}
        data-orientation={orientation}
        className={cn(
          orientation === 'vertical' ? 'flex gap-2' : 'flex flex-col gap-2',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, children, ...rest },
  ref,
) {
  const ctx = useTabsContext();
  return (
    <RovingFocusGroup
      ref={ref as never}
      orientation={ctx.orientation}
      loop
      role="tablist"
      aria-orientation={ctx.orientation}
      data-orientation={ctx.orientation}
      className={cn(
        'inline-flex border-border',
        ctx.orientation === 'vertical' ? 'flex-col border-r' : 'flex-row border-b',
        className,
      )}
      {...rest}
    >
      {children}
    </RovingFocusGroup>
  );
});

export interface TabsTabProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  disabled?: boolean;
}

export const TabsTab = forwardRef<HTMLButtonElement, TabsTabProps>(function TabsTab(
  { value, disabled = false, className, onClick, onFocus, children, ...rest },
  ref,
) {
  const ctx = useTabsContext();
  const roving = useRovingFocusItem();
  const selected = ctx.value === value;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;

  return (
    <button
      ref={(node) => {
        roving.ref(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      id={tabId}
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls={panelId}
      data-state={selected ? 'active' : 'inactive'}
      data-disabled={dataAttr(disabled)}
      tabIndex={roving.tabIndex}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || disabled) return;
        ctx.setValue(value);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        roving.onFocus();
        if (ctx.activationMode === 'automatic' && !disabled) {
          ctx.setValue(value);
        }
      }}
      onKeyDown={roving.onKeyDown}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[state=active]:text-foreground data-[state=active]:border-primary',
        ctx.orientation === 'vertical'
          ? 'border-r-2 border-transparent data-[state=active]:border-primary'
          : 'border-b-2 border-transparent data-[state=active]:border-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface TabsPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export const TabsPanel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { value, className, children, ...rest },
  ref,
) {
  const ctx = useTabsContext();
  if (ctx.value !== value) return null;
  const tabId = `${ctx.baseId}-tab-${value}`;
  const panelId = `${ctx.baseId}-panel-${value}`;
  return (
    <div
      ref={ref}
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn(
        'flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

type TabsComponent = typeof Tabs & {
  List: typeof TabsList;
  Tab: typeof TabsTab;
  Panel: typeof TabsPanel;
};

(Tabs as TabsComponent).List = TabsList;
(Tabs as TabsComponent).Tab = TabsTab;
(Tabs as TabsComponent).Panel = TabsPanel;

export default Tabs as TabsComponent;
