/**
 * Dashboard metric fixtures — KPIs, sparklines, contribution heatmap,
 * deploy frequency. All values fixed or derived from fixed literals
 * (no clock, no random).
 */

export type DeltaDirection = 'up' | 'down' | 'flat';

export interface Kpi {
  id: string;
  label: string;
  /** Display-ready value, e.g. "$48.2k". */
  value: string;
  /** Raw numeric value backing `value`. */
  rawValue: number;
  /** Percent change vs previous period, e.g. 12.4 or -3.1. */
  delta: number;
  deltaDirection: DeltaDirection;
  /** Period the delta compares against. */
  comparedTo: string;
}

export const kpis: Kpi[] = [
  {
    id: 'kpi-mrr',
    label: 'MRR',
    value: '$48.2k',
    rawValue: 48_200,
    delta: 12.4,
    deltaDirection: 'up',
    comparedTo: 'last month',
  },
  {
    id: 'kpi-active-deploys',
    label: 'Active deployments',
    value: '34',
    rawValue: 34,
    delta: 6.3,
    deltaDirection: 'up',
    comparedTo: 'last week',
  },
  {
    id: 'kpi-error-rate',
    label: 'Error rate',
    value: '0.42%',
    rawValue: 0.42,
    delta: -18.0,
    deltaDirection: 'down',
    comparedTo: 'last week',
  },
  {
    id: 'kpi-uptime',
    label: 'Uptime (30d)',
    value: '99.97%',
    rawValue: 99.97,
    delta: 0,
    deltaDirection: 'flat',
    comparedTo: 'last 30 days',
  },
  {
    id: 'kpi-open-tickets',
    label: 'Open tickets',
    value: '17',
    rawValue: 17,
    delta: -22.7,
    deltaDirection: 'down',
    comparedTo: 'last week',
  },
  {
    id: 'kpi-signups',
    label: 'New signups',
    value: '312',
    rawValue: 312,
    delta: 9.1,
    deltaDirection: 'up',
    comparedTo: 'last month',
  },
];

export interface SparklineSeries {
  id: string;
  label: string;
  /** Fixed 16-point series. */
  points: number[];
  unit: string;
}

export const sparklines: SparklineSeries[] = [
  {
    id: 'spark-mrr',
    label: 'MRR',
    points: [31.2, 32.0, 32.8, 34.1, 35.0, 36.4, 37.1, 38.9, 40.2, 41.0, 42.6, 43.1, 44.8, 46.0, 47.3, 48.2],
    unit: 'k USD',
  },
  {
    id: 'spark-requests',
    label: 'API requests',
    points: [820, 940, 910, 1_050, 1_120, 980, 1_240, 1_310, 1_180, 1_420, 1_390, 1_510, 1_460, 1_580, 1_620, 1_710],
    unit: 'k/day',
  },
  {
    id: 'spark-latency',
    label: 'p95 latency',
    points: [212, 208, 224, 198, 190, 230, 186, 178, 195, 172, 168, 181, 162, 158, 164, 151],
    unit: 'ms',
  },
  {
    id: 'spark-errors',
    label: 'Errors',
    points: [42, 38, 51, 33, 29, 64, 27, 22, 31, 18, 24, 19, 15, 21, 12, 14],
    unit: '/day',
  },
];

export interface HeatmapDay {
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  /** Activity count for that day (0–12). */
  count: number;
}

/** Fixed epoch — 2026-01-01 (Thursday). */
const HEATMAP_EPOCH_UTC = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;

/** Weekly rhythm Thu..Wed (matching epoch weekday), low weekends. */
const weekRhythm = [5, 4, 1, 0, 6, 7, 5] as const;
/** 13-step fixed variation cycle layered on the weekly rhythm. */
const variation = [0, 2, 1, 3, 0, 1, 4, 2, 0, 3, 1, 2, 5] as const;

const isoDay = (offset: number): string =>
  new Date(HEATMAP_EPOCH_UTC + offset * DAY_MS).toISOString().slice(0, 10);

/**
 * Daily activity counts for 2026-01-01 → 2026-06-30 (181 days).
 * Derived purely from the fixed literal cycles above — deterministic.
 */
export const heatmapDays: HeatmapDay[] = Array.from({ length: 181 }, (_, i) => {
  const base = weekRhythm[i % 7] ?? 0;
  const extra = variation[i % 13] ?? 0;
  const count = base === 0 ? (extra > 3 ? 1 : 0) : Math.min(base + extra, 12);
  return { date: isoDay(i), count };
});

export interface DeployFrequencyPoint {
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  /** Deploys shipped that week. */
  count: number;
}

/** Fixed Monday epoch — 2026-01-05. */
const WEEK_EPOCH_UTC = Date.UTC(2026, 0, 5);

const weeklyDeployCounts = [
  8, 11, 9, 14, 12, 10, 16, 13, 9, 17, 15, 12, 19,
  14, 11, 18, 16, 13, 21, 17, 15, 20, 18, 16, 23, 19,
] as const;

/** Weekly deploy counts, 26 weeks: 2026-01-05 → week of 2026-06-29. */
export const deployFrequency: DeployFrequencyPoint[] = weeklyDeployCounts.map(
  (count, i) => ({
    weekStart: new Date(WEEK_EPOCH_UTC + i * 7 * DAY_MS).toISOString().slice(0, 10),
    count,
  }),
);
