import type { OpacityPreset, Theme } from "@/types";

/** Ships with the app; community themes follow this exact shape (see /themes). */
export const DEFAULT_THEME: Theme = {
  id: "cozy-default",
  name: "Cozy Cream",
  colors: {
    surface: "#F9F5F1",
    surfaceSoft: "#F2ECE4",
    accent: "#E08E79",
    accentDim: "#C97A65",
    text: "#4E596F",
    textDeep: "#333B4D",
  },
};

/**
 * Below this opacity the cream surface no longer provides enough
 * contrast against arbitrary desktop backgrounds, so text/icons switch
 * to pure white with a soft drop shadow instead of slate.
 */
const LOW_OPACITY_CONTRAST_THRESHOLD: OpacityPreset = 40;

export function resolveContrastMode(opacity: OpacityPreset): "light" | "dark" {
  return opacity <= LOW_OPACITY_CONTRAST_THRESHOLD ? "light" : "dark";
}

export function opacityToAlpha(opacity: OpacityPreset): number {
  return opacity / 100;
}

/** Convert a theme into CSS custom properties applied at the document root. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    "--surface": theme.colors.surface,
    "--surface-soft": theme.colors.surfaceSoft,
    "--accent": theme.colors.accent,
    "--accent-dim": theme.colors.accentDim,
    "--text": theme.colors.text,
    "--text-deep": theme.colors.textDeep,
  };
}
