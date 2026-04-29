import { Button } from '@wow-two-beta/ui';

export function App() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>@wow-two-beta/ui playground</h1>
      <p>Ad-hoc sandbox for prototyping. Storybook is the catalog.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
    </main>
  );
}
