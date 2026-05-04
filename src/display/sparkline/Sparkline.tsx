import { forwardRef, useId, useMemo, type SVGAttributes } from 'react';
import { cn } from '../../utils';

export type SparklineVariant = 'line' | 'area' | 'bar' | 'dot';
export type SparklineTone = 'brand' | 'success' | 'warning' | 'danger' | 'muted' | 'current';

export interface SparklineProps extends Omit<SVGAttributes<SVGSVGElement>, 'width' | 'height'> {
  data: number[];
  variant?: SparklineVariant;
  width?: number;
  height?: number;
  tone?: SparklineTone;
  min?: number;
  max?: number;
  showLast?: boolean;
  /** Accessible label summarizing the trend. */
  ariaLabel?: string;
}

const TONE_CLASS: Record<SparklineTone, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
  current: '',
};

/**
 * Inline trend chart — line / area / bar / dot. SVG, no scales/axes/legend.
 * Color via Tailwind tokens (`text-*`); pair with `currentColor` for parent
 * inheritance.
 */
export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    data,
    variant = 'line',
    width = 120,
    height = 32,
    tone = 'brand',
    min: minProp,
    max: maxProp,
    showLast,
    ariaLabel = 'Trend',
    className,
    ...rest
  },
  ref,
) {
  const titleId = useId();
  const { points, barWidth, lastX, lastY, areaPath, linePath } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], barWidth: 0, lastX: 0, lastY: 0, areaPath: '', linePath: '' };
    }
    const min = minProp ?? Math.min(...data);
    const max = maxProp ?? Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length === 1 ? 0 : width / (data.length - 1);
    const pad = 1; // keep stroke inside the box
    const pointsArr = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - pad * 2) - pad;
      return [x, y] as const;
    });
    const lp = pointsArr.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
    const ap = `${lp} L${pointsArr[pointsArr.length - 1]![0]},${height} L${pointsArr[0]![0]},${height} Z`;
    const bw = data.length > 0 ? width / data.length - 1 : 0;
    const last = pointsArr[pointsArr.length - 1]!;
    return { points: pointsArr, barWidth: bw, lastX: last[0], lastY: last[1], areaPath: ap, linePath: lp };
  }, [data, height, width, minProp, maxProp]);

  return (
    <svg
      ref={ref}
      role="img"
      aria-labelledby={titleId}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('inline-block overflow-visible', TONE_CLASS[tone], className)}
      {...rest}
    >
      <title id={titleId}>{ariaLabel}</title>
      {variant === 'area' && (
        <>
          <path d={areaPath} fill="currentColor" fillOpacity={0.15} />
          <path d={linePath} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {variant === 'line' && (
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {variant === 'bar' && (
        <g>
          {points.map(([x, y], i) => (
            <rect
              key={i}
              x={x - barWidth / 2}
              y={y}
              width={Math.max(1, barWidth)}
              height={height - y}
              fill="currentColor"
              rx={1}
            />
          ))}
        </g>
      )}
      {variant === 'dot' && (
        <g>
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.5} fill="currentColor" />
          ))}
        </g>
      )}
      {showLast && data.length > 0 && variant !== 'dot' && (
        <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
      )}
    </svg>
  );
});
