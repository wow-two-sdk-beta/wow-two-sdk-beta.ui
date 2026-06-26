import { THEMES } from '@wow-two-beta/ui/themes';
import { Select, Switch } from '@wow-two-beta/ui/forms';
import { Text } from '@wow-two-beta/ui/display';
import { useThemeStudio } from '../theme/ThemeContext';

/* Header controls — the global theme picker (applies app-wide via the provider)
   and the dark-mode switch. Both drive the root wrapper + <body> mirror. */
export function ThemeControls() {
  const { themeId, setThemeId, dark, setDark } = useThemeStudio();

  return (
    <div className="flex items-center gap-3">
      <div className="w-44">
        <Select<string> value={themeId} onValueChange={(opt) => opt && setThemeId(opt.itemKey)}>
          <Select.Trigger size="sm">
            <Select.Value placeholder="Theme…" />
          </Select.Trigger>
          <Select.Content>
            {THEMES.map((t) => (
              <Select.Item key={t.id} itemKey={t.id} label={t.name} />
            ))}
          </Select.Content>
        </Select>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <Text size="sm" color="muted">
          Dark
        </Text>
        <Switch checked={dark} onChange={(e) => setDark(e.target.checked)} aria-label="Toggle dark mode" />
      </label>
    </div>
  );
}
