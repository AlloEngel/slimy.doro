import type { OpacityPreset, Theme } from "@/types";

/**
 * Centralized theme registry.
 *
 * Every theme must provide the full set of color tokens below so that
 * any part of the UI can rely on them being present, regardless of
 * which theme is currently active. There are intentionally no separate
 * theme JSON files — keeping every definition here makes the full set
 * of available themes discoverable in one place and avoids an extra
 * file-loading step at runtime.
 */
const THEME_REGISTRY: Record<string, Theme> = {
  slate: {
    id: "slate",
    name: "Dusk Slate",
    colors: {
      surface: "#172038",
      surfaceSoft: "#253A5E",
      accent: "#73BED3",
      accentDim: "#4F8FBA",
      text: "#E7E9EE",
      textDeep: "#FFFFFF",
      onAccent: "#172038",
    },
  },

  cream: {
    id: "cream",
    name: "Cozy Cream",
    colors: {
      surface: "#F9F5F1",
      surfaceSoft: "#F2ECE4",
      accent: "#E08E79",
      accentDim: "#C97A65",
      text: "#4E596F",
      textDeep: "#333B4D",
      onAccent: "#FFFFFF",
    },
  },

  dracula: {
    id: "dracula",
    name: "Dracula",
    colors: {
      surface: "#282A36",
      surfaceSoft: "#343746",
      accent: "#BD93F9",
      accentDim: "#6272A4",
      text: "#F8F8F2",
      textDeep: "#FFFFFF",
      onAccent: "#282A36",
    },
  },

  gruvbox: {
    id: "gruvbox",
    name: "Gruvbox",
    colors: {
      surface: "#282828",
      surfaceSoft: "#3C3836",
      accent: "#FE8019",
      accentDim: "#D65D0E",
      text: "#EBDBB2",
      textDeep: "#FBF1C7",
      onAccent: "#282828",
    },
  },

  black: {
    id: "black",
    name: "100% Black",
    colors: {
      surface: "#000000",
      surfaceSoft: "#111111",
      accent: "#FFFFFF",
      accentDim: "#AAAAAA",
      text: "#FFFFFF",
      textDeep: "#FFFFFF",
      onAccent: "#000000",
    },
  },

  nord: {
    id: "nord",
    name: "Nord",
    colors: {
      surface: "#2E3440",
      surfaceSoft: "#3B4252",
      accent: "#88C0D0",
      accentDim: "#5E81AC",
      text: "#D8DEE9",
      textDeep: "#ECEFF4",
      onAccent: "#2E3440",
    },
  },

  catppuccin: {
    id: "catppuccin",
    name: "Catppuccin Mocha",
    colors: {
      surface: "#1E1E2E",
      surfaceSoft: "#313244",
      accent: "#CBA6F7",
      accentDim: "#B4BEFE",
      text: "#CDD6F4",
      textDeep: "#FFFFFF",
      onAccent: "#1E1E2E",
    },
  },

  tokyonight: {
    id: "tokyonight",
    name: "Tokyo Night",
    colors: {
      surface: "#1A1B26",
      surfaceSoft: "#24283B",
      accent: "#7AA2F7",
      accentDim: "#3D59A1",
      text: "#C0CAF5",
      textDeep: "#FFFFFF",
      onAccent: "#1A1B26",
    },
  },

  solarized: {
    id: "solarized",
    name: "Solarized Dark",
    colors: {
      surface: "#002B36",
      surfaceSoft: "#073642",
      accent: "#2AA198",
      accentDim: "#268BD2",
      text: "#93A1A1",
      textDeep: "#EEE8D5",
      onAccent: "#002B36",
    },
  },

  onedark: {
    id: "onedark",
    name: "One Dark",
    colors: {
      surface: "#282C34",
      surfaceSoft: "#3E4451",
      accent: "#61AFEF",
      accentDim: "#528BBF",
      text: "#ABB2BF",
      textDeep: "#FFFFFF",
      onAccent: "#282C34",
    },
  },

  monokai: {
    id: "monokai",
    name: "Monokai",
    colors: {
      surface: "#272822",
      surfaceSoft: "#3E3D32",
      accent: "#A6E22E",
      accentDim: "#82AB1F",
      text: "#F8F8F2",
      textDeep: "#FFFFFF",
      onAccent: "#272822",
    },
  },
};

export const DEFAULT_THEME_ID = "slate";

/** Ships with the app as the fallback used whenever a theme ID can't be resolved. */
export const DEFAULT_THEME: Theme = THEME_REGISTRY[DEFAULT_THEME_ID];

/** Returns every available theme, in registry declaration order. */
export function getThemes(): Theme[] {
  return Object.values(THEME_REGISTRY);
}

/**
 * Resolves a theme by ID, falling back to the default theme when the
 * ID is unknown (e.g. stale persisted data, or a theme that no longer
 * exists in the registry).
 */
export function getThemeById(themeId: string): Theme {
  return THEME_REGISTRY[themeId] ?? DEFAULT_THEME;
}

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
    "--on-accent": theme.colors.onAccent,
  };
}

/**
 * Per-theme CSS filter recipe used to recolor the (originally blue)
 * slime sprite sheets at render time.
 *
 * The sprites are static PNGs — there is no per-theme artwork and no
 * pixel-level palette swap here. Instead, `hue-rotate` shifts every
 * saturated (colored) pixel's hue while leaving grayscale pixels
 * (blacks, whites, outline shading) untouched, since hue has no effect
 * on zero-saturation colors. This preserves the sprite's linework and
 * tonal shading while retargeting its dominant hue to match each
 * theme's accent color. `hueRotate` values below were derived from the
 * actual hue of each theme's accent color relative to the sprite's
 * original blue (~193° hue, matching the Dusk Slate accent #73BED3).
 * `saturate`/`brightness` are hand-tuned per theme to better match its
 * overall mood (e.g. pastel for Cozy Cream, muted for Gruvbox/Solarized).
 */
interface SlimeFilterConfig {
  hueRotate: number;
  saturate: number;
  brightness: number;
}

const SLIME_FILTERS: Record<string, SlimeFilterConfig> = {
  // Matches the sprite's native blue — no shift needed.
  slate: { hueRotate: 0, saturate: 1, brightness: 1 },

  // Rotates blue toward orange/peach, softened for a pastel feel.
  cream: { hueRotate: 179, saturate: 0.85, brightness: 1.08 },

  // Rotates blue toward Dracula's purple accent.
  dracula: { hueRotate: 72, saturate: 1, brightness: 1 },

  // Rotates blue toward Gruvbox's warm orange, slightly muted.
  gruvbox: { hueRotate: 194, saturate: 0.9, brightness: 0.95 },

  // Exception: 100% Black keeps the slime's original blue palette.
  black: { hueRotate: 0, saturate: 1, brightness: 1 },

  // Nord's accent hue is close to the sprite's native blue; desaturate
  // and brighten slightly for a frosty, icy look instead of a hue shift.
  nord: { hueRotate: 0, saturate: 0.85, brightness: 1.05 },

  // Rotates blue toward Catppuccin's lavender accent.
  catppuccin: { hueRotate: 74, saturate: 1, brightness: 1 },

  // Rotates blue toward Tokyo Night's indigo-blue accent.
  tokyonight: { hueRotate: 28, saturate: 1, brightness: 1 },

  // Rotates blue toward Solarized's teal accent, slightly muted.
  solarized: { hueRotate: 343, saturate: 0.9, brightness: 0.95 },

  // Rotates blue toward One Dark's brighter blue accent.
  onedark: { hueRotate: 14, saturate: 1, brightness: 1 },

  // Rotates blue toward Monokai's lime-green accent.
  monokai: { hueRotate: 247, saturate: 1, brightness: 1 },
};

/**
 * Returns the CSS `filter` value used to recolor the slime sprite for
 * the given theme. Falls back to the default theme's filter (a no-op)
 * for unknown theme IDs.
 */
export function getSlimeFilter(themeId: string): string {
  const config = SLIME_FILTERS[themeId] ?? SLIME_FILTERS[DEFAULT_THEME_ID];

  return `hue-rotate(${config.hueRotate}deg) saturate(${config.saturate}) brightness(${config.brightness})`;
}