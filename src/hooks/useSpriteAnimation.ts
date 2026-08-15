import { useEffect, useRef, useState } from "react";
import type { SpriteAnimationConfig } from "@/lib/sprites";

interface UseSpriteAnimationResult {
  frameIndex: number;
}

/**
 * Drives a single sprite sheet's frame index forward at `config.fps`,
 * using requestAnimationFrame for smooth, tab-throttled timing. Non-
 * looping animations (jump, death) call `onComplete` once after the
 * final frame has had its full duration on screen.
 */
export function useSpriteAnimation(
  config: SpriteAnimationConfig,
  onComplete?: () => void,
): UseSpriteAnimationResult {
  const [frameIndex, setFrameIndex] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setFrameIndex(0);
    lastFrameTimeRef.current = 0;
    const frameDuration = 1000 / config.fps;
    let currentFrame = 0;
    let finished = false;

    const step = (timestamp: number) => {
      if (finished) return;
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameDuration) {
        lastFrameTimeRef.current = timestamp;
        const isLastFrame = currentFrame >= config.frameCount - 1;

        if (isLastFrame && !config.loop) {
          finished = true;
          setFrameIndex(currentFrame);
          onCompleteRef.current?.();
          return;
        }

        currentFrame = isLastFrame ? 0 : currentFrame + 1;
        setFrameIndex(currentFrame);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      finished = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Re-run whenever the underlying sheet/frame-count/fps/loop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.src, config.frameCount, config.fps, config.loop]);

  return { frameIndex };
}
