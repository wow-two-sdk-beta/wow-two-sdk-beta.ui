import { useMemo, useState } from 'react';
import {
  generateTheme,
  themeToCss,
  validateTheme,
  contrastPairs,
  contrastRatioCss,
  type AccentMode,
  type NeutralTemp,
  type SurfaceStyle,
} from '@wow-two-beta/ui/themes';
import { SegmentedControl, ToggleButton } from '@wow-two-beta/ui/actions';
import { Badge, Card, Heading, Text } from '@wow-two-beta/ui/display';
import { Slider } from '@wow-two-beta/ui/forms';
import { ThemePreviewScope } from '../theme/ThemePreviewScope';
import { PreviewBoard } from '../components/PreviewBoard';

const NEUTRAL_TEMPS: NeutralTemp[] = ['cool', 'neutral', 'warm'];
const ACCENT_MODES: AccentMode[] = ['complementary', 'analogous', 'triadic', 'mono'];
const SURFACES: SurfaceStyle[] = ['soft', 'crisp'];

const GEN_ID = 'studio-generated';

/* Generator playground — seed controls feed `generateTheme` live (pure +
   deterministic). The result isn't in the static themes.css, so its scoped CSS
   is emitted with `themeToCss` and injected via a <style> tag; the preview +
   gallery cards then resolve `theme-studio-generated`. A validation panel lists
   every contrast pair's pass/fail straight from the same checker the engine
   uses. */
export default function GeneratorPage() {
  const [primaryHue, setPrimaryHue] = useState(264);
  const [neutralTemp, setNeutralTemp] = useState<NeutralTemp>('neutral');
  const [accentMode, setAccentMode] = useState<AccentMode>('complementary');
  const [surface, setSurface] = useState<SurfaceStyle>('crisp');
  const [dark, setDark] = useState(false);

  const theme = useMemo(
    () =>
      generateTheme({
        id: GEN_ID,
        name: 'Generated',
        primaryHue,
        neutralTemp,
        accentMode,
        surface,
      }),
    [primaryHue, neutralTemp, accentMode, surface],
  );

  const css = useMemo(() => themeToCss(theme), [theme]);
  const meta = useMemo(() => validateTheme(theme), [theme]);

  // Per-pair pass/fail for the active mode's token set.
  const set = dark ? theme.dark : theme.light;
  const pairs = useMemo(
    () =>
      contrastPairs().map((p) => {
        const ratio = contrastRatioCss(set[p.fg], set[p.bg]);
        return { ...p, ratio, pass: ratio >= p.min };
      }),
    [set],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Inject the generated theme's scoped CSS so previews can resolve it. */}
      <style>{css}</style>

      <div>
        <Heading level={1} size="2xl" weight="bold">
          Generator playground
        </Heading>
        <Text color="muted" className="mt-1">
          Tune the OKLCH seed and watch <code>generateTheme</code> rebuild a proven theme live.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        {/* Controls + validation */}
        <div className="flex flex-col gap-5">
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text size="sm" weight="medium">
                  Primary hue
                </Text>
                <Text size="sm" color="muted" isTabular>
                  {primaryHue}°
                </Text>
              </div>
              <Slider
                min={0}
                max={360}
                step={1}
                value={primaryHue}
                onChange={(e) => setPrimaryHue(Number(e.target.value))}
                aria-label="Primary hue"
              />
              <div
                className="h-3 w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, oklch(0.7 0.18 0), oklch(0.7 0.18 60), oklch(0.7 0.18 120), oklch(0.7 0.18 180), oklch(0.7 0.18 240), oklch(0.7 0.18 300), oklch(0.7 0.18 360))',
                }}
              />
            </div>

            <Control label="Neutral temperature">
              <SegmentedControl
                type="single"
                value={neutralTemp}
                onValueChange={(v) => v && setNeutralTemp(v as NeutralTemp)}
                aria-label="Neutral temperature"
              >
                {NEUTRAL_TEMPS.map((t) => (
                  <ToggleButton key={t} value={t} className="capitalize">
                    {t}
                  </ToggleButton>
                ))}
              </SegmentedControl>
            </Control>

            <Control label="Accent mode">
              <SegmentedControl
                type="single"
                value={accentMode}
                onValueChange={(v) => v && setAccentMode(v as AccentMode)}
                aria-label="Accent mode"
                className="flex-wrap"
              >
                {ACCENT_MODES.map((m) => (
                  <ToggleButton key={m} value={m} className="capitalize">
                    {m}
                  </ToggleButton>
                ))}
              </SegmentedControl>
            </Control>

            <Control label="Surface">
              <SegmentedControl
                type="single"
                value={surface}
                onValueChange={(v) => v && setSurface(v as SurfaceStyle)}
                aria-label="Surface"
              >
                {SURFACES.map((s) => (
                  <ToggleButton key={s} value={s} className="capitalize">
                    {s}
                  </ToggleButton>
                ))}
              </SegmentedControl>
            </Control>

            <Control label="Preview mode">
              <SegmentedControl
                type="single"
                value={dark ? 'dark' : 'light'}
                onValueChange={(v) => v && setDark(v === 'dark')}
                aria-label="Preview mode"
              >
                <ToggleButton value="light">Light</ToggleButton>
                <ToggleButton value="dark">Dark</ToggleButton>
              </SegmentedControl>
            </Control>
          </Card>

          {/* Live contrast validation */}
          <Card padding="lg" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Text size="sm" weight="semibold">
                Contrast — {dark ? 'dark' : 'light'}
              </Text>
              {meta.contrastAA ? (
                <Badge variant="success" size="sm">
                  AA proven
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  {meta.failures?.length ?? 0} fail
                </Badge>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              {pairs.map((p) => (
                <li
                  key={`${p.fg}:${p.bg}`}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate font-mono text-muted-foreground">
                    {p.fg} / {p.bg}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono tabular-nums text-subtle-foreground">
                      {p.ratio.toFixed(2)} / {p.min.toFixed(1)}
                    </span>
                    <Badge variant={p.pass ? 'success' : 'danger'} size="sm">
                      {p.pass ? 'pass' : 'fail'}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Live preview of the generated theme */}
        <ThemePreviewScope
          themeId={GEN_ID}
          isDark={dark}
          className="rounded-lg border border-border p-4"
        >
          <PreviewBoard />
        </ThemePreviewScope>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" weight="medium">
        {label}
      </Text>
      {children}
    </div>
  );
}
