export type TimerMode = "focus" | "short-break" | "long-break";

export type SlimeState = "idle" | "walk" | "jump" | "death" | "sleep";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  favorite: boolean;
  createdAt: number;
}

export type OpacityPreset = 20 | 40 | 60 | 80;

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
  showTodo: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  alwaysOnTop: boolean;
  timer: TimerSettings;
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
  };
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartNext: true, // was false — sessions now chain automatically
};

export const DEFAULT_SETTINGS: AppSettings = {
  opacity: 80,
  showTodo: true,
  soundEnabled: true,
  notificationsEnabled: true,
  alwaysOnTop: false,
  timer: DEFAULT_TIMER_SETTINGS,
  themeId: "cozy-default",
};