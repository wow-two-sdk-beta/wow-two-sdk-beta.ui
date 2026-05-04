import { forwardRef, useMemo, useRef, type KeyboardEvent, type SVGAttributes } from 'react';
import { cn } from '../../utils';

export type AudioWaveformTone = 'brand' | 'success' | 'warning' | 'danger' | 'muted' | 'current';

const TONE_CLASS: Record<AudioWaveformTone, string> = {
  brand: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
  current: '',
};

export interface AudioWaveformProps extends Omit<SVGAttributes<SVGSVGElement>, 'width' | 'height' | 'onSeek'> {
  peaks: number[];
  progress?: number;
  width?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
  tone?: AudioWaveformTone;
  onSeek?: (progress: number) => void;
  interactive?: boolean;
}

/**
 * SVG bar-style audio waveform. `peaks` are per-bin amplitudes in 0..1.
 * Click-to-seek + arrow-key seek when `onSeek` is provided.
 */
export const AudioWaveform = forwardRef<SVGSVGElement, AudioWaveformProps>(
  function AudioWaveform(
    {
      peaks,
      progress = 0,
      width = 320,
      height = 48,
      barWidth = 2,
      gap = 1,
      tone = 'brand',
      onSeek,
      interactive,
      className,
      ...rest
    },
    ref,
  ) {
    const stepX = barWidth + gap;
    const barCount = Math.max(1, Math.floor(width / stepX));
    const sampled = useMemo(() => sampleTo(peaks, barCount), [peaks, barCount]);
    const playedBars = Math.round(progress * barCount);
    const isInteractive = interactive ?? onSeek != null;
    const seekFromX = (clientX: number, rect: DOMRect) => {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      onSeek?.(x / rect.width);
    };
    const svgRef = useRef<SVGSVGElement | null>(null);

    const handleKey = (e: KeyboardEvent<SVGSVGElement>) => {
      if (!onSeek) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(1, progress + 0.05));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, progress - 0.05));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onSeek(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onSeek(1);
      }
    };

    return (
      <svg
        ref={(el) => {
          svgRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<SVGSVGElement | null>).current = el;
        }}
        role={isInteractive ? 'slider' : 'img'}
        aria-label="Audio waveform"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={isInteractive ? 0 : -1}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onClick={
          isInteractive
            ? (e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) seekFromX(e.clientX, rect);
              }
            : undefined
        }
        onKeyDown={handleKey}
        className={cn(
          'inline-block',
          isInteractive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
          TONE_CLASS[tone],
          className,
        )}
        {...rest}
      >
        {sampled.map((amp, i) => {
          const h = Math.max(1, amp * height);
          const x = i * stepX;
          const y = (height - h) / 2;
          const played = i < playedBars;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={1}
              className={played ? 'fill-current' : 'fill-current opacity-30'}
            />
          );
        })}
      </svg>
    );
  },
);

/** Resample `peaks` to exactly `n` bars by max-pooling consecutive runs. */
function sampleTo(peaks: number[], n: number): number[] {
  if (peaks.length === 0) return new Array(n).fill(0);
  if (peaks.length === n) return peaks;
  const out: number[] = new Array(n);
  const ratio = peaks.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      const v = Math.abs(peaks[j]!);
      if (v > max) max = v;
    }
    out[i] = max;
  }
  return out;
}
