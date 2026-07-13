import { useState } from 'react';
import { SupplyFilterBarMock } from './scenarios/SupplyFilterBarMock';
import './themes/haven.css';

const SCENARIOS = {
  'supply-filter-bar': { label: 'Supply Filter Bar (haven)', Component: SupplyFilterBarMock },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

/** Provides the playground shell — sidebar of scenarios + main content + theme toggle. */
export function App() {
  const [scenario, setScenario] = useState<ScenarioKey>('supply-filter-bar');
  const [dark, setDark] = useState(true);
  const [haven, setHaven] = useState(true);

  const Active = SCENARIOS[scenario].Component;

  return (
    <div className={[dark && 'dark', haven && 'theme-haven'].filter(Boolean).join(' ')}>
      <div className="grid min-h-svh grid-cols-[220px_1fr] bg-background text-foreground">
        <aside className="flex flex-col gap-2 border-r border-border p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
            Playground
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {Object.entries(SCENARIOS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenario(key as ScenarioKey)}
                className={`rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  scenario === key
                    ? 'bg-muted text-foreground'
                    : 'text-subtle-foreground hover:bg-muted/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 text-xs">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
              <span>Dark</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={haven}
                onChange={(e) => setHaven(e.target.checked)}
              />
              <span>Haven theme</span>
            </label>
          </div>
        </aside>
        <main className="overflow-auto p-6">
          <Active />
        </main>
      </div>
    </div>
  );
}
