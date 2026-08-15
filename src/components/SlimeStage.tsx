import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { resolveAnimation, SPRITE_ANIMATIONS } from "@/lib/sprites";
import { useSpriteAnimation } from "@/hooks/useSpriteAnimation";
import type { SlimeState } from "@/types";

const DISPLAY_SCALE = 3.5; // 32px source frames -> ~112px on screen

/** Preload every sheet once so switching states never shows a blank frame. */
function useImageCache() {
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    Object.values(SPRITE_ANIMATIONS).forEach((anim) => {
      if (cache.current.has(anim.src)) return;
      const img = new Image();
      img.src = anim.src;
      cache.current.set(anim.src, img);
    });
  }, []);
  return cache;
}

interface ZzzParticle {
  id: number;
  offset: number;
}

export function SlimeStage() {
  const isRunning = useAppStore((s) => s.isRunning);
  const mode = useAppStore((s) => s.mode);
  const lastEvent = useAppStore((s) => s.lastEvent);
  const clearLastEvent = useAppStore((s) => s.clearLastEvent);

  const [overlay, setOverlay] = useState<Extract<SlimeState, "jump" | "death"> | null>(null);
  const handledEventId = useRef<number | null>(null);

  // Base state reflects what the pet does "at rest" for the current
  // timer mode; one-shot overlay events (jump/death) briefly take over.
  const baseState: SlimeState = !isRunning ? "idle" : mode === "focus" ? "walk" : "sleep";

  useEffect(() => {
    if (!lastEvent || lastEvent.id === handledEventId.current) return;
    handledEventId.current = lastEvent.id;
    setOverlay(lastEvent.kind);
  }, [lastEvent]);

  const activeState = overlay ?? baseState;
  const config = useMemo(() => resolveAnimation(activeState), [activeState]);

  const handleComplete = () => {
    if (overlay) {
      setOverlay(null);
      clearLastEvent();
    }
  };

  const { frameIndex } = useSpriteAnimation(config, handleComplete);
  const imageCache = useImageCache();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const size = config.frameSize * DISPLAY_SCALE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imageCache.current.get(config.src);
    if (!img) return;

    const draw = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        frameIndex * config.frameSize,
        0,
        config.frameSize,
        config.frameSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [frameIndex, config, imageCache]);

  const isSleeping = activeState === "sleep";
  const particles = useZzzParticles(isSleeping);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size + 28 }}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute select-none font-display text-[10px] text-slime-500 animate-float-up"
          style={{ top: 6, left: `calc(50% + ${p.offset}px)` }}
          aria-hidden
        >
          z
        </span>
      ))}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="pixelated"
        style={{ width: size, height: size, marginTop: 20 }}
        role="img"
        aria-label={`Slime companion, currently ${activeState}`}
      />
    </div>
  );
}

/** Spawns a floating "z" every couple seconds while the slime is asleep. */
function useZzzParticles(active: boolean): ZzzParticle[] {
  const [particles, setParticles] = useState<ZzzParticle[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const spawn = () => {
      const id = ++counter.current;
      const offset = 10 + Math.random() * 12;
      setParticles((prev) => [...prev.slice(-4), { id, offset }]);
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1400);
    };
    spawn();
    const interval = window.setInterval(spawn, 1800);
    return () => window.clearInterval(interval);
  }, [active]);

  return particles;
}
