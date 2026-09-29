export type TimerMode = "focus" | "short-break" | "long-break";
export type SlimeState = "idle" | "walk" | "jump" | "death" | "sleep";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  favorite: boolean;
  createdAt: number;
}

// Free-form opacity percentage controlled by the Settings slider.
// Clamping is handled by the store's setOpacity action.
export type OpacityPreset = number;

export type SnapPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  autoStartNext: boolean;
}

export interface AppSettings {
  opacity: OpacityPreset;

  // Enables the native platform background blur/acrylic effect.
  blurBackground: boolean;

  // Controls whether the slime sprite animation is visible.
  showSlime: boolean;

  // Controls whether the Timer module (countdown + controls) is visible.
  showTimer: boolean;

  // Controls whether the to-do list is visible.
  showTodo: boolean;

  // Controls whether application sound effects are enabled.
  soundEnabled: boolean;

  // Controls whether desktop notifications are enabled.
  notificationsEnabled: boolean;

  // Controls the native Always on Top window state.
  alwaysOnTop: boolean;

  // Stores all Pomodoro timer configuration values.
  timer: TimerSettings;

  // Identifies the currently selected visual theme.
  themeId: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    surface: string;
    surfaceSoft: string;
    accent: string;
    accentDim: string;
    text: string;
    textDeep: string;
    // Foreground color used for text/icons placed directly on top of
    // the accent color (e.g. the primary CTA button, the Pin Mode
    // shortcut banner). Kept separate per-theme because a single
    // hardcoded foreground (white, dark, etc.) does not have enough
    // contrast against every accent color across all themes.
    onAccent: string;
  };
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: true,
};

export const DEFAULT_SETTINGS: AppSettings = {
  opacity: 100,
  blurBackground: false,

  // The slime animation remains enabled by default to preserve
  // the application's existing behavior for new and old users.
  showSlime: true,

  // Timer module is enabled by default, preserving prior behavior for
  // existing users whose persisted settings predate this option.
  showTimer: true,

  showTodo: true,
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: false,
  timer: DEFAULT_TIMER_SETTINGS,

  // Dusk Slate is the application's default theme. Existing persisted
  // settings created before the theme system existed do not contain a
  // themeId at all; the store's hydrate() merges DEFAULT_SETTINGS first
  // and the persisted object second, so any settings file missing this
  // key automatically falls back to "slate" without extra handling.
  themeId: "slate",
};