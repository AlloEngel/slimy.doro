import { create } from "zustand";
import {
    DEFAULT_SETTINGS,
    type AppSettings,
    type Task,
    type TimerMode,
    type OpacityPreset,
} from "@/types";
import { readJsonFile, writeJsonFile, notify, setAlwaysOnTop as tauriSetAlwaysOnTop } from "@/lib/tauri";
import { playTaskComplete, playTimerComplete, playReset, playClick } from "@/lib/audio";

// Hard ceiling on task count, enforced here so it can't be bypassed
// by any UI path that calls addTask.
export const MAX_TASKS = 10;

interface SlimeEvent {
    kind: "jump" | "death";
    id: number;
}

interface AppState {
    hydrated: boolean;
    settings: AppSettings;
    tasks: Task[];

    mode: TimerMode;
    secondsLeft: number;
    isRunning: boolean;
    cycle: number;
    lastEvent: SlimeEvent | null;

    hydrate: () => Promise<void>;

    setOpacity: (opacity: OpacityPreset) => void;
    toggleShowTodo: () => void;
    toggleSound: () => void;
    toggleNotifications: () => void;
    toggleAlwaysOnTop: () => void;
    updateTimerSettings: (partial: Partial<AppSettings["timer"]>) => void;

    addTask: (title: string) => void;
    toggleTaskDone: (id: string) => void;
    toggleTaskFavorite: (id: string) => void;
    renameTask: (id: string, title: string) => void;
    deleteTask: (id: string) => void;

    startPause: () => void;
    resetSession: () => void;
    skipSession: () => void;
    tick: () => void;
    clearLastEvent: () => void;
}

function secondsForMode(mode: TimerMode, settings: AppSettings): number {
    const t = settings.timer;
    if (mode === "focus") return t.focusMinutes * 60;
    if (mode === "short-break") return t.shortBreakMinutes * 60;
    return t.longBreakMinutes * 60;
}

function persistSettings(settings: AppSettings) {
    void writeJsonFile("config.json", settings);
}

function persistTasks(tasks: Task[]) {
    void writeJsonFile("tasks.json", tasks);
}

let eventCounter = 0;

export const useAppStore = create<AppState>((set) => ({
    hydrated: false,
    settings: DEFAULT_SETTINGS,
    tasks: [],

    mode: "focus",
    secondsLeft: DEFAULT_SETTINGS.timer.focusMinutes * 60,
    isRunning: false,
    cycle: 1,
    lastEvent: null,

    hydrate: async () => {
        const [storedSettings, storedTasks] = await Promise.all([
            readJsonFile<AppSettings>("config.json"),
            readJsonFile<Task[]>("tasks.json"),
        ]);
        const settings = { ...DEFAULT_SETTINGS, ...(storedSettings ?? {}) };
        set({
            settings,
            tasks: storedTasks ?? [],
            secondsLeft: secondsForMode("focus", settings),
            hydrated: true,
        });
    },

    setOpacity: (opacity) =>
        set((state) => {
            const settings = { ...state.settings, opacity };
            persistSettings(settings);
            return { settings };
        }),

    toggleShowTodo: () =>
        set((state) => {
            const settings = { ...state.settings, showTodo: !state.settings.showTodo };
            persistSettings(settings);
            return { settings };
        }),

    toggleSound: () =>
        set((state) => {
            const settings = { ...state.settings, soundEnabled: !state.settings.soundEnabled };
            persistSettings(settings);
            return { settings };
        }),

    toggleNotifications: () =>
        set((state) => {
            const settings = { ...state.settings, notificationsEnabled: !state.settings.notificationsEnabled };
            persistSettings(settings);
            return { settings };
        }),

    toggleAlwaysOnTop: () =>
        set((state) => {
            const enabled = !state.settings.alwaysOnTop;
            void tauriSetAlwaysOnTop(enabled);
            const settings = { ...state.settings, alwaysOnTop: enabled };
            persistSettings(settings);
            return { settings };
        }),

    updateTimerSettings: (partial) =>
        set((state) => {
            const timer = { ...state.settings.timer, ...partial };
            const settings = { ...state.settings, timer };
            persistSettings(settings);
            const secondsLeft = state.isRunning ? state.secondsLeft : secondsForMode(state.mode, settings);
            return { settings, secondsLeft };
        }),

    addTask: (title) =>
        set((state) => {
            const trimmed = title.trim();
            // Silently no-op past the cap — UI disables the input before
            // this point, but the store is the real enforcement boundary.
            if (!trimmed || state.tasks.length >= MAX_TASKS) return state;
            const task: Task = {
                id: crypto.randomUUID(),
                title: trimmed,
                done: false,
                favorite: false,
                createdAt: Date.now(),
            };
            const tasks = [task, ...state.tasks];
            persistTasks(tasks);
            if (state.settings.soundEnabled) playClick();
            return { tasks };
        }),

    toggleTaskDone: (id) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
            persistTasks(tasks);
            const justCompleted = tasks.find((t) => t.id === id)?.done;
            if (justCompleted && state.settings.soundEnabled) playTaskComplete();
            return {
                tasks,
                lastEvent: justCompleted ? { kind: "jump", id: ++eventCounter } : state.lastEvent,
            };
        }),

    toggleTaskFavorite: (id) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t));
            persistTasks(tasks);
            return { tasks };
        }),

    renameTask: (id, title) =>
        set((state) => {
            const tasks = state.tasks.map((t) => (t.id === id ? { ...t, title } : t));
            persistTasks(tasks);
            return { tasks };
        }),

    deleteTask: (id) =>
        set((state) => {
            const tasks = state.tasks.filter((t) => t.id !== id);
            persistTasks(tasks);
            return { tasks };
        }),

    startPause: () =>
        set((state) => {
            const isRunning = !state.isRunning;
            if (isRunning && state.settings.soundEnabled) playClick();
            return { isRunning };
        }),

    resetSession: () =>
        set((state) => {
            if (state.settings.soundEnabled) playReset();
            return {
                isRunning: false,
                secondsLeft: secondsForMode(state.mode, state.settings),
                lastEvent: { kind: "death", id: ++eventCounter },
            };
        }),

    skipSession: () => set((state) => computeAdvance(state, false)),

    tick: () =>
        set((state) => {
            if (!state.isRunning) return state;
            if (state.secondsLeft > 1) {
                return { secondsLeft: state.secondsLeft - 1 };
            }
            return computeAdvance(state, true);
        }),

    clearLastEvent: () => set({ lastEvent: null }),
}));

function computeAdvance(state: AppState, completed: boolean): Partial<AppState> {
    const { settings } = state;
    let nextMode: TimerMode;
    let nextCycle = state.cycle;

    if (state.mode === "focus") {
        const isLongBreakDue = state.cycle >= settings.timer.cyclesBeforeLongBreak;
        nextMode = isLongBreakDue ? "long-break" : "short-break";
    } else {
        nextMode = "focus";
        if (state.mode === "long-break") nextCycle = 1;
        else nextCycle = state.cycle + 1;
    }

    if (completed) {
        if (settings.soundEnabled) playTimerComplete();
        if (settings.notificationsEnabled) {
            const label =
                state.mode === "focus"
                    ? "Focus session complete — nice work!"
                    : "Break's over — ready for another round?";
            void notify("Pixel Slime Pomodoro", label);
        }
    }

    return {
        mode: nextMode,
        cycle: nextCycle,
        secondsLeft: secondsForMode(nextMode, settings),
        isRunning: settings.timer.autoStartNext,
        lastEvent: completed ? { kind: "jump", id: ++eventCounter } : state.lastEvent,
    };
}