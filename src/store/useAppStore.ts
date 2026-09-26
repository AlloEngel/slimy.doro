import { create } from "zustand";
import {
    DEFAULT_SETTINGS,
    type AppSettings,
    type Task,
    type TimerMode,
    type OpacityPreset,
} from "@/types";
import {
    readJsonFile,
    writeJsonFile,
    notify,
    setAlwaysOnTop as tauriSetAlwaysOnTop,
} from "@/lib/tauri";
import {
    playTaskComplete,
    playTimerComplete,
    playReset,
    playClick,
} from "@/lib/audio";

// Hard ceiling on the number of tasks.
// This is enforced inside the store so no UI path can bypass the limit.
export const MAX_TASKS = 10;

// Represents an animation event sent to the slime companion.
interface SlimeEvent {
    kind: "jump" | "death";
    id: number;
}

// Contains all persistent and runtime state used by the application.
interface AppState {
    // Indicates whether saved settings and tasks have finished loading.
    hydrated: boolean;

    // User-configurable application settings.
    settings: AppSettings;

    // Tasks currently stored by the user, in their manual display order.
    tasks: Task[];

    // Current Pomodoro mode.
    mode: TimerMode;

    // Remaining seconds in the current Pomodoro session.
    secondsLeft: number;

    // Indicates whether the current timer is actively running.
    isRunning: boolean;

    // Current Pomodoro cycle number.
    cycle: number;

    // Latest event that should trigger a slime animation.
    lastEvent: SlimeEvent | null;

    // Loads persisted settings and tasks from storage.
    hydrate: () => Promise<void>;

    // Updates the application's opacity setting.
    setOpacity: (opacity: OpacityPreset) => void;

    // Shows or hides the Todo list.
    toggleShowTodo: () => void;

    // Enables or disables application sounds.
    toggleSound: () => void;

    // Enables or disables desktop notifications.
    toggleNotifications: () => void;

    // Enables or disables the native always-on-top behavior.
    toggleAlwaysOnTop: () => void;

    // Updates one or more Pomodoro timer settings.
    updateTimerSettings: (partial: Partial<AppSettings["timer"]>) => void;

    // Creates a new task at the beginning of the task list.
    addTask: (title: string) => void;

    // Toggles the completed state of a task.
    toggleTaskDone: (id: string) => void;

    // Toggles the favorite state of a task.
    toggleTaskFavorite: (id: string) => void;

    // Changes the title of an existing task.
    renameTask: (id: string, title: string) => void;

    // Removes a task from the list.
    deleteTask: (id: string) => void;

    // Moves a task one position upward.
    moveTaskUp: (id: string) => void;

    // Moves a task one position downward.
    moveTaskDown: (id: string) => void;

    // Moves a task with mouse drag.
    moveTask: (taskId: string, targetIndex: number) => void;

    // Starts or pauses the current Pomodoro session.
    startPause: () => void;

    // Stops the current session and resets its timer.
    resetSession: () => void;

    // Skips the current session and advances to the next Pomodoro mode.
    skipSession: () => void;

    // Advances the timer by one second.
    tick: () => void;

    // Clears the latest slime animation event.
    clearLastEvent: () => void;

}

/**
 * Returns the duration, in seconds, associated with a given Pomodoro mode.
 */
function secondsForMode(
    mode: TimerMode,
    settings: AppSettings,
): number {
    const t = settings.timer;

    if (mode === "focus") {
        return t.focusMinutes * 60;
    }

    if (mode === "short-break") {
        return t.shortBreakMinutes * 60;
    }

    return t.longBreakMinutes * 60;
}

/**
 * Persists the current application settings to the local configuration file.
 */
function persistSettings(settings: AppSettings): void {
    void writeJsonFile("config.json", settings);
}

/**
 * Persists the current task order and task data to the local task file.
 */
function persistTasks(tasks: Task[]): void {
    void writeJsonFile("tasks.json", tasks);
}

// Generates unique IDs for slime animation events.
let eventCounter = 0;

/**
 * Main Zustand store containing application state and all state-changing actions.
 */
export const useAppStore = create<AppState>((set) => ({
    hydrated: false,
    settings: DEFAULT_SETTINGS,
    tasks: [],

    mode: "focus",
    secondsLeft: DEFAULT_SETTINGS.timer.focusMinutes * 60,
    isRunning: false,
    cycle: 1,
    lastEvent: null,

    /**
     * Loads saved settings and tasks from persistent storage.
     *
     * If no saved data exists, the application falls back to the
     * default settings and an empty task list.
     */
    hydrate: async () => {
        const [storedSettings, storedTasks] = await Promise.all([
            readJsonFile<AppSettings>("config.json"),
            readJsonFile<Task[]>("tasks.json"),
        ]);

        const settings = {
            ...DEFAULT_SETTINGS,
            ...(storedSettings ?? {}),
        };

        set({
            settings,
            tasks: storedTasks ?? [],
            secondsLeft: secondsForMode("focus", settings),
            hydrated: true,
        });
    },

    /**
     * Changes the application's transparency preset and saves it.
     */
    setOpacity: (opacity) =>
        set((state) => {
            const settings = {
                ...state.settings,
                opacity,
            };

            persistSettings(settings);

            return { settings };
        }),

    /**
     * Toggles visibility of the Todo section and saves the preference.
     */
    toggleShowTodo: () =>
        set((state) => {
            const settings = {
                ...state.settings,
                showTodo: !state.settings.showTodo,
            };

            persistSettings(settings);

            return { settings };
        }),

    /**
     * Toggles application sound effects and saves the preference.
     */
    toggleSound: () =>
        set((state) => {
            const settings = {
                ...state.settings,
                soundEnabled: !state.settings.soundEnabled,
            };

            persistSettings(settings);

            return { settings };
        }),

    /**
     * Toggles desktop notifications and saves the preference.
     */
    toggleNotifications: () =>
        set((state) => {
            const settings = {
                ...state.settings,
                notificationsEnabled:
                    !state.settings.notificationsEnabled,
            };

            persistSettings(settings);

            return { settings };
        }),

    /**
     * Toggles the native always-on-top behavior of the window.
     */
    toggleAlwaysOnTop: () =>
        set((state) => {
            const enabled = !state.settings.alwaysOnTop;

            void tauriSetAlwaysOnTop(enabled);

            const settings = {
                ...state.settings,
                alwaysOnTop: enabled,
            };

            persistSettings(settings);

            return { settings };
        }),

    /**
     * Updates one or more timer configuration values.
     *
     * When the timer is stopped, changing its duration immediately
     * updates the displayed remaining time. A running timer keeps
     * its current countdown unchanged.
     */
    updateTimerSettings: (partial) =>
        set((state) => {
            const timer = {
                ...state.settings.timer,
                ...partial,
            };

            const settings = {
                ...state.settings,
                timer,
            };

            persistSettings(settings);

            const secondsLeft = state.isRunning
                ? state.secondsLeft
                : secondsForMode(state.mode, settings);

            return {
                settings,
                secondsLeft,
            };
        }),

    /**
     * Adds a new task to the beginning of the manually ordered list.
     *
     * Empty titles are ignored, and the global MAX_TASKS limit is
     * enforced here regardless of whether the UI has disabled the input.
     */
    addTask: (title) =>
        set((state) => {
            const trimmed = title.trim();

            if (!trimmed || state.tasks.length >= MAX_TASKS) {
                return state;
            }

            const task: Task = {
                id: crypto.randomUUID(),
                title: trimmed,
                done: false,
                favorite: false,
                createdAt: Date.now(),
            };

            const tasks = [task, ...state.tasks];

            persistTasks(tasks);

            if (state.settings.soundEnabled) {
                playClick();
            }

            return { tasks };
        }),

    /**
     * Toggles whether a task is marked as completed.
     *
     * Completing a task also triggers the slime's jump animation
     * and optionally plays the task completion sound.
     */
    toggleTaskDone: (id) =>
        set((state) => {
            const tasks = state.tasks.map((task) =>
                task.id === id
                    ? {
                        ...task,
                        done: !task.done,
                    }
                    : task,
            );

            persistTasks(tasks);

            const justCompleted = tasks.find(
                (task) => task.id === id,
            )?.done;

            if (
                justCompleted &&
                state.settings.soundEnabled
            ) {
                playTaskComplete();
            }

            return {
                tasks,
                lastEvent: justCompleted
                    ? {
                        kind: "jump",
                        id: ++eventCounter,
                    }
                    : state.lastEvent,
            };
        }),

    /**
     * Toggles the favorite state of a task.
     *
     * Favoriting does not change the task's position because task
     * ordering is now controlled manually by the user.
     */
    toggleTaskFavorite: (id) =>
        set((state) => {
            const tasks = state.tasks.map((task) =>
                task.id === id
                    ? {
                        ...task,
                        favorite: !task.favorite,
                    }
                    : task,
            );

            persistTasks(tasks);

            return { tasks };
        }),

    /**
     * Renames an existing task and persists the updated task list.
     */
    renameTask: (id, title) =>
        set((state) => {
            const trimmed = title.trim();

            if (!trimmed) {
                return state;
            }

            const tasks = state.tasks.map((task) =>
                task.id === id
                    ? {
                        ...task,
                        title: trimmed,
                    }
                    : task,
            );

            persistTasks(tasks);

            return { tasks };
        }),

    /**
     * Removes a task from the list and persists the new order.
     */
    deleteTask: (id) =>
        set((state) => {
            const tasks = state.tasks.filter(
                (task) => task.id !== id,
            );

            persistTasks(tasks);

            return { tasks };
        }),

    /**
     * Moves a task one position upward.
     */
    moveTaskUp: (id) =>
        set((state) => {
            const index = state.tasks.findIndex(
                (task) => task.id === id,
            );

            if (index <= 0) {
                return state;
            }

            const tasks = [...state.tasks];

            [tasks[index - 1], tasks[index]] = [
                tasks[index],
                tasks[index - 1],
            ];

            persistTasks(tasks);

            return { tasks };
        }),

    /**
     * Moves a task one position downward.
     */
    moveTaskDown: (id) =>
        set((state) => {
            const index = state.tasks.findIndex(
                (task) => task.id === id,
            );

            if (
                index === -1 ||
                index >= state.tasks.length - 1
            ) {
                return state;
            }

            const tasks = [...state.tasks];

            [tasks[index], tasks[index + 1]] = [
                tasks[index + 1],
                tasks[index],
            ];

            persistTasks(tasks);

            return { tasks };
        }),

    /**
     * Moves a task directly to a specific position.
     *
     * Used by drag and drop.
     */
    moveTask: (taskId, targetIndex) =>
        set((state) => {
            const currentIndex = state.tasks.findIndex(
                (task) => task.id === taskId,
            );

            if (
                currentIndex === -1 ||
                targetIndex < 0 ||
                targetIndex >= state.tasks.length ||
                currentIndex === targetIndex
            ) {
                return state;
            }

            const tasks = [...state.tasks];
            const [movedTask] = tasks.splice(currentIndex, 1);

            tasks.splice(targetIndex, 0, movedTask);

            persistTasks(tasks);

            return { tasks };
        }),
    startPause: () =>
        set((state) => {
            const isRunning = !state.isRunning;

            if (
                isRunning &&
                state.settings.soundEnabled
            ) {
                playClick();
            }

            return { isRunning };
        }),

    /**
     * Stops the current session, restores its original duration,
     * and triggers the slime's death/reset animation.
     */
    resetSession: () =>
        set((state) => {
            if (state.settings.soundEnabled) {
                playReset();
            }

            return {
                isRunning: false,
                secondsLeft: secondsForMode(
                    state.mode,
                    state.settings,
                ),
                lastEvent: {
                    kind: "death",
                    id: ++eventCounter,
                },
            };
        }),

    /**
     * Skips the current Pomodoro session and advances to the
     * next appropriate focus or break period.
     */
    skipSession: () =>
        set((state) => computeAdvance(state, false)),

    /**
     * Advances the timer by one second.
     *
     * When the countdown reaches zero, the current session is
     * completed and the next Pomodoro period is started.
     */
    tick: () =>
        set((state) => {
            if (!state.isRunning) {
                return state;
            }

            if (state.secondsLeft > 1) {
                return {
                    secondsLeft: state.secondsLeft - 1,
                };
            }

            return computeAdvance(state, true);
        }),

    /**
     * Removes the current slime animation event after the
     * corresponding animation has finished playing.
     */
    clearLastEvent: () =>
        set({
            lastEvent: null,
        }),
}));

/**
 * Calculates the next Pomodoro mode and cycle after a session
 * is skipped or completed.
 *
 * Focus sessions lead to either a short or long break.
 * Break sessions return to focus. After a long break, the
 * Pomodoro cycle counter starts again at one.
 */
function computeAdvance(
    state: AppState,
    completed: boolean,
): Partial<AppState> {
    const { settings } = state;

    let nextMode: TimerMode;
    let nextCycle = state.cycle;

    if (state.mode === "focus") {
        const isLongBreakDue =
            state.cycle >=
            settings.timer.cyclesBeforeLongBreak;

        nextMode = isLongBreakDue
            ? "long-break"
            : "short-break";
    } else {
        nextMode = "focus";

        if (state.mode === "long-break") {
            nextCycle = 1;
        } else {
            nextCycle = state.cycle + 1;
        }
    }

    // Completed sessions play the completion sound and may
    // trigger a desktop notification.
    if (completed) {
        if (settings.soundEnabled) {
            playTimerComplete();
        }

        if (settings.notificationsEnabled) {
            const label =
                state.mode === "focus"
                    ? "Focus session complete — nice work!"
                    : "Break's over — ready for another round?";

            void notify(
                "Pixel Slime Pomodoro",
                label,
            );
        }
    }

    return {
        mode: nextMode,
        cycle: nextCycle,
        secondsLeft: secondsForMode(
            nextMode,
            settings,
        ),
        isRunning:
        settings.timer.autoStartNext,
        lastEvent: completed
            ? {
                kind: "jump",
                id: ++eventCounter,
            }
            : state.lastEvent,
    };
}