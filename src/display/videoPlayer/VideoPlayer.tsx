import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type VideoHTMLAttributes,
} from 'react';
import {
  Captions,
  CaptionsOff,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface VideoTrack {
  src: string;
  srcLang: string;
  label: string;
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  default?: boolean;
}

export interface VideoPlayerProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'controls'> {
  src: string;
  poster?: string;
  tracks?: VideoTrack[];
  aspectRatio?: string | number;
  defaultVolume?: number;
  defaultPlaybackRate?: number;
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
 * Custom-controls video player. Click video to toggle play; controls
 * auto-hide after 3s during playback; keyboard shortcuts (Space/F/M/C/←/→/↑/↓).
 */
export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer(
    {
      src,
      poster,
      tracks,
      aspectRatio = '16 / 9',
      autoPlay,
      loop,
      muted: mutedProp,
      defaultVolume = 1,
      defaultPlaybackRate = 1,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    useImperativeHandle(forwardedRef, () => videoRef.current as HTMLVideoElement);
    const [playing, setPlaying] = useState(!!autoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(defaultVolume);
    const [muted, setMuted] = useState(!!mutedProp);
    const [speed, setSpeed] = useState(defaultPlaybackRate);
    const [fullscreen, setFullscreen] = useState(false);
    const [captionsOn, setCaptionsOn] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const idleTimerRef = useRef<number | null>(null);

    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      v.volume = volume;
      v.muted = muted;
      v.playbackRate = speed;
    }, [volume, muted, speed]);

    useEffect(() => {
      const v = videoRef.current;
      if (!v || !v.textTracks) return;
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i]!.mode = captionsOn ? 'showing' : 'hidden';
      }
    }, [captionsOn, tracks]);

    useEffect(() => {
      const onFsChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
      document.addEventListener('fullscreenchange', onFsChange);
      return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const togglePlay = useCallback(() => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }, []);

    const seekTo = useCallback((seconds: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(seconds)) return;
      v.currentTime = Math.max(0, Math.min(v.duration || 0, seconds));
    }, []);

    const toggleFullscreen = useCallback(async () => {
      const c = containerRef.current;
      if (!c) return;
      if (!document.fullscreenElement) {
        await c.requestFullscreen?.().catch(() => {});
      } else {
        await document.exitFullscreen?.().catch(() => {});
      }
    }, []);

    const togglePiP = useCallback(async () => {
      const v = videoRef.current;
      if (!v) return;
      if ('pictureInPictureElement' in document && document.pictureInPictureElement) {
        await (document as unknown as { exitPictureInPicture?: () => Promise<void> })
          .exitPictureInPicture?.()
          ?.catch(() => {});
      } else if ('requestPictureInPicture' in v) {
        await (v as HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> })
          .requestPictureInPicture?.()
          ?.catch(() => {});
      }
    }, []);

    const bumpControls = useCallback(() => {
      setShowControls(true);
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      if (playing) {
        idleTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
      }
    }, [playing]);

    useEffect(() => {
      bumpControls();
      return () => {
        if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      };
    }, [playing, bumpControls]);

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
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          if (tracks && tracks.length > 0) setCaptionsOn((c) => !c);
          break;
      }
    };

    return (
      <div
        ref={containerRef}
        role="region"
        aria-label="Video player"
        tabIndex={0}
        onKeyDown={handleKey}
        onMouseMove={bumpControls}
        onMouseLeave={() => {
          if (playing) setShowControls(false);
        }}
        className={cn(
          'group relative overflow-hidden rounded-md bg-black text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        style={{ aspectRatio: typeof aspectRatio === 'number' ? String(aspectRatio) : aspectRatio }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) setDuration(v.duration || 0);
          }}
          onClick={togglePlay}
          className="h-full w-full bg-black"
          {...rest}
        >
          {tracks?.map((t, i) => (
            <track
              key={i}
              src={t.src}
              srcLang={t.srcLang}
              label={t.label}
              kind={t.kind ?? 'captions'}
              default={t.default}
            />
          ))}
        </video>

        {/* Big center play button when paused */}
        {!playing && (
          <button
            type="button"
            aria-label="Play"
            onClick={togglePlay}
            className="absolute inset-0 grid place-items-center bg-black/30 transition-opacity hover:bg-black/40"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-foreground shadow-lg">
              <Icon icon={Play} size={28} />
            </span>
          </button>
        )}

        {/* Controls bar */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 transition-opacity',
            showControls ? 'opacity-100' : 'opacity-0',
          )}
        >
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <Icon icon={playing ? Pause : Play} size={14} />
          </button>
          <span className="text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
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
            className="flex-1 accent-primary"
          />
          <button
            type="button"
            aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
            onClick={() => setMuted((m) => !m)}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/20 hover:text-white"
          >
            <Icon icon={muted || volume === 0 ? VolumeX : Volume2} size={14} />
          </button>
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-7 rounded-sm border border-white/20 bg-black/40 px-1 text-xs"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s} className="text-foreground">
                {s}×
              </option>
            ))}
          </select>
          {tracks && tracks.length > 0 && (
            <button
              type="button"
              aria-label={captionsOn ? 'Hide captions' : 'Show captions'}
              aria-pressed={captionsOn}
              onClick={() => setCaptionsOn((c) => !c)}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/20 hover:text-white"
            >
              <Icon icon={captionsOn ? Captions : CaptionsOff} size={14} />
            </button>
          )}
          <button
            type="button"
            aria-label="Picture in picture"
            onClick={togglePiP}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/20 hover:text-white"
          >
            <Icon icon={PictureInPicture2} size={14} />
          </button>
          <button
            type="button"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={toggleFullscreen}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/20 hover:text-white"
          >
            <Icon icon={fullscreen ? Minimize : Maximize} size={14} />
          </button>
        </div>
      </div>
    );
  },
);
