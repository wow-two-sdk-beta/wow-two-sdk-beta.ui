import { useState } from 'react';
import { Heading, Text } from '@wow-two-beta/ui/display';
import { SegmentedControl, ToggleButton } from '@wow-two-beta/ui/actions';
import { useThemeStudio } from '../theme/ThemeContext';
import { ThemePreviewScope } from '../theme/ThemePreviewScope';
import { PreviewBoard } from '../components/PreviewBoard';

type Mode = 'active' | 'split';

/* Preview board — a rich representative screen under the SELECTED theme. Two
   modes: "active" follows the app's dark toggle (and so reflects portaled UI
   too); "split" shows light + dark side-by-side via locally-scoped panels. */
export default function PreviewPage() {
  const { theme } = useThemeStudio();
  const [mode, setMode] = useState<Mode>('active');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading level={1} size="2xl" weight="bold">
            {theme.name} preview
          </Heading>
          <Text color="muted" className="mt-1">
            {theme.description}
          </Text>
        </div>
        <SegmentedControl
          type="single"
          aria-label="Preview mode"
          value={mode}
          onValueChange={(next) => next && setMode(next as Mode)}
        >
          <ToggleButton value="active">Active mode</ToggleButton>
          <ToggleButton value="split">Light + dark</ToggleButton>
        </SegmentedControl>
      </div>

      {mode === 'active' ? (
        <PreviewBoard />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ThemePreviewScope
            themeId={theme.id}
            isDark={false}
            className="rounded-lg border border-border p-4"
          >
            <Text size="xs" weight="semibold" color="muted" className="mb-3 block uppercase tracking-wide">
              Light
            </Text>
            <PreviewBoard />
          </ThemePreviewScope>

          <ThemePreviewScope
            themeId={theme.id}
            isDark
            className="rounded-lg border border-border p-4"
          >
            <Text size="xs" weight="semibold" color="muted" className="mb-3 block uppercase tracking-wide">
              Dark
            </Text>
            <PreviewBoard />
          </ThemePreviewScope>
        </div>
      )}
    </div>
  );
}
