import { useTheme } from '../theme/ThemeContext';

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1 text-sm text-muted-foreground">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
    </label>
  );
}

export function ThemeToggle() {
  const { dark, haven, setDark, setHaven } = useTheme();
  return (
    <div className="flex flex-col rounded-md border border-border py-1">
      <ToggleRow label="Dark" checked={dark} onChange={setDark} />
      <ToggleRow label="Haven theme" checked={haven} onChange={setHaven} />
    </div>
  );
}
