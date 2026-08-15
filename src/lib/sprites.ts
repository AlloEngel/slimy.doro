import idleSheet from "@/assets/sprites/slime_blue_idle-Sheet.png";
import walkSheet from "@/assets/sprites/slime_blue_walk-Sheet.png";
import jumpSheet from "@/assets/sprites/slime_blue_jump-Sheet.png";
import deathSheet from "@/assets/sprites/slime_blue_death-Sheet.png";
import type { SlimeState } from "@/types";

export interface SpriteAnimationConfig {
  src: string;
  frameCount: number;
  frameSize: number;
  /** Frames per second at normal (1x) playback speed. */
  fps: number;
  /** Whether the animation should loop or play once and hand off to idle. */
  loop: boolean;
}

// All four sheets share a 32x32px frame size, laid out horizontally.
const FRAME_SIZE = 32;

export const SPRITE_ANIMATIONS: Record<Exclude<SlimeState, "sleep">, SpriteAnimationConfig> = {
  idle: { src: idleSheet, frameCount: 10, frameSize: FRAME_SIZE, fps: 8, loop: true },
  walk: { src: walkSheet, frameCount: 7, frameSize: FRAME_SIZE, fps: 10, loop: true },
  jump: { src: jumpSheet, frameCount: 12, frameSize: FRAME_SIZE, fps: 14, loop: false },
  death: { src: deathSheet, frameCount: 5, frameSize: FRAME_SIZE, fps: 7, loop: false },
};

/** "sleep" reuses the idle sheet at reduced speed per the design spec. */
export function resolveAnimation(state: SlimeState): SpriteAnimationConfig {
  if (state === "sleep") {
    return { ...SPRITE_ANIMATIONS.idle, fps: SPRITE_ANIMATIONS.idle.fps * 0.7 };
  }
  return SPRITE_ANIMATIONS[state];
}
