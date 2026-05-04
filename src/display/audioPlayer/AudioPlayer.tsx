import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type AudioHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { AudioWaveform } from '../audioWaveform';

export interface AudioPlayerProps
  extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'controls' | 'onPlay' | 'onPause' | 'onTimeUpdate' | 'onEnded'> {
  src: string;
  peaks?: number[];
  defaultVolume?: number;
  defaultPlaybackRate?: number;
  compact?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Custom-controls audio player. Native `<audio>` underneath; play/pause,
 * scrubber (or `AudioWaveform` if `peaks` provided), volume, speed.
 */
export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  function AudioPlayer(
    {
      src,
      peaks,
      autoPlay,
      loop,
      defaultVolume = 1,
      defaultPlaybackRate = 1,
      compact,
      onPlay,
      onPause,
      onTimeUpdate,
      onEnded,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useImperativeHandle(forwardedRef, () => audioRef.current as HTMLAudioElement);
    const [playing, setPlaying] = useState(!!autoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(defaultVolume);
    const [muted, setMuted] = useState(false);
    const [speed, setSpeed] = useState(defaultPlaybackRate);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.volume = volume;
      a.muted = muted;
      a.playbackRate = speed;
    }, [volume, muted, speed]);

    const togglePlay = useCallback(() => {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        a.play().catch(() => {
          /* autoplay rejection */
        });
      } else {
        a.pause();
      }
    }, []);

    const seekTo = useCallback((seconds: number) => {
      const a = audioRef.current;
      if (!a || !Number.isFinite(seconds)) return;
      a.currentTime = Math.max(0, Math.min(a.duration || 0, seconds));
    }, []);

    const seekProgress = useCallback(
      (p: number) => {
        if (duration > 0) seekTo(p * duration);
      },
      [duration, seekTo],
    );

    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(currentTime - 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setMuted((m) => !m);
          break;
      }
    };

    const progress = duration > 0 ? currentTime / duration : 0;

    return (
      <div
        role="region"
        aria-label="Audio player"
        tabIndex={0}
        onKeyDown={handleKey}
        data-playing={playing || undefined}
        className={cn(
          'flex items-center gap-3 rounded-md border border-border bg-card p-2 text-card-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          compact && 'gap-2 p-1.5',
          className,
        )}
      >
        <audio
          ref={audioRef}
          src={src}
          autoPlay={autoPlay}
          loop={loop}
          onPlay={() => {
            setPlaying(true);
            onPlay?.();
          }}
          onPause={() => {
            setPlaying(false);
            onPause?.();
          }}
          onTimeUpdate={() => {
            const a = audioRef.current;
            if (!a) return;
            setCurrentTime(a.currentTime);
            onTimeUpdate?.(a.currentTime, a.duration);
          }}
          onLoadedMetadata={() => {
            const a = audioRef.current;
            if (a) setDuration(a.duration || 0);
          }}
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
          {...rest}
        />
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            compact ? 'h-7 w-7' : 'h-9 w-9',
          )}
        >
          <Icon icon={playing ? Pause : Play} size={compact ? 12 : 14} />
        </button>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" style={{ minWidth: '3.5rem' }}>
          {formatTime(currentTime)}
        </span>
        <div className="flex-1">
          {peaks ? (
            <AudioWaveform
              peaks={peaks}
              progress={progress}
              onSeek={seekProgress}
              width={compact ? 200 : 320}
              height={compact ? 32 : 40}
            />
          ) : (
            <input
              type="range"
              role="slider"
              aria-label="Seek"
              aria-valuetext={formatTime(currentTime)}
              min={0}
              max={duration || 0}
              step="any"
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full accent-primary"
            />
          )}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground" style={{ minWidth: '3.5rem', textAlign: 'right' }}>
          {formatTime(duration)}
        </span>
        <button
          type="button"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => setMuted((m) => !m)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={muted || volume === 0 ? VolumeX : Volume2} size={14} />
        </button>
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="h-7 rounded-sm border border-input bg-background px-1 text-xs"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
    );
  },
);
