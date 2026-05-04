import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Portal } from '../../primitives';

export interface ConfettiOrigin {
  x?: number;
  y?: number;
}

export interface ConfettiFireOptions {
  particleCount?: number;
  colors?: string[];
  spread?: number;
  velocity?: number;
  origin?: ConfettiOrigin;
}

export interface ConfettiProps {
  particleCount?: number;
  colors?: string[];
  gravity?: number;
  spread?: number;
  velocity?: number;
  lifetime?: number;
  origin?: ConfettiOrigin;
  /** Auto-fire on mount. Useful for one-shot confetti on a route landing. */
  autoFire?: boolean;
}

export interface ConfettiHandle {
  fire: (opts?: ConfettiFireOptions) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle';
  bornAt: number;
}

const DEFAULT_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

let nextParticleId = 0;

/**
 * Confetti burst. Imperative `fire()` via ref or `autoFire` on mount. SVG
 * particles animated by rAF. No-op under `prefers-reduced-motion`.
 */
export const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(function Confetti(
  {
    particleCount = 60,
    colors = DEFAULT_COLORS,
    gravity = 1200,
    spread = 60,
    velocity = 500,
    lifetime = 3000,
    origin,
    autoFire,
  },
  forwardedRef,
) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const reducedRef = useRef(
    typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false),
  );

  const spawn = useCallback(
    (opts?: ConfettiFireOptions) => {
      if (reducedRef.current) return;
      const count = opts?.particleCount ?? particleCount;
      const palette = opts?.colors ?? colors;
      const sp = opts?.spread ?? spread;
      const vel = opts?.velocity ?? velocity;
      const o = opts?.origin ?? origin;
      const x = o?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
      const y = o?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);
      const burst: Particle[] = [];
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        // Angle: upward (-90deg) ± spread/2.
        const angle = (-Math.PI / 2) + ((Math.random() - 0.5) * (sp * Math.PI)) / 180;
        const speed = vel * (0.7 + Math.random() * 0.6);
        burst.push({
          id: ++nextParticleId,
          x,
          y,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 60,
          vy: Math.sin(angle) * speed,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720,
          size: 6 + Math.random() * 6,
          color: palette[Math.floor(Math.random() * palette.length)] ?? '#000',
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
          bornAt: now,
        });
      }
      setParticles((prev) => [...prev, ...burst]);
    },
    [particleCount, colors, spread, velocity, origin],
  );

  useImperativeHandle(forwardedRef, () => ({ fire: spawn }), [spawn]);

  useEffect(() => {
    if (autoFire) spawn();
  }, [autoFire, spawn]);

  // Animation loop.
  useEffect(() => {
    if (particles.length === 0) return;

    const tick = (now: number) => {
      const last = lastTimeRef.current || now;
      const dt = (now - last) / 1000;
      lastTimeRef.current = now;
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            vy: p.vy + gravity * dt,
            rotation: p.rotation + p.rotationSpeed * dt,
          }))
          .filter((p) => p.y < viewportH + 80 && now - p.bornAt < lifetime),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [particles.length, gravity, lifetime]);

  if (particles.length === 0) return null;

  return (
    <Portal>
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
        style={{ width: '100vw', height: '100vh' }}
      >
        {particles.map((p) =>
          p.shape === 'rect' ? (
            <rect
              key={p.id}
              x={p.x - p.size / 2}
              y={p.y - p.size / 2}
              width={p.size}
              height={p.size * 0.5}
              fill={p.color}
              transform={`rotate(${p.rotation} ${p.x} ${p.y})`}
            />
          ) : (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.size / 2} fill={p.color} />
          ),
        )}
      </svg>
    </Portal>
  );
});
