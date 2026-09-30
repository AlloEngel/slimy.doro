import { type ReactNode } from "react";
import {
    ChevronDown,
    ChevronUp,
    RotateCcw,
    X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { snapWindow } from "@/lib/tauri";
import { getThemes } from "@/lib/theme";
import {
    DEFAULT_TIMER_SETTINGS,
    type SnapPosition,
} from "@/types";

const SNAP_POSITIONS: { id: SnapPosition; label: string }[] = [
    { id: "top-left", label: "Top left" },
    { id: "top-right", label: "Top right" },
    { id: "center", label: "Center" },
    { id: "bottom-left", label: "Bottom left" },
    { id: "bottom-right", label: "Bottom right" },
];

/**
 * Reusable toggle control used for boolean settings.
 *
 * Uses the shared .toggle-track / .toggle-track-on / .toggle-thumb
 * classes (see index.css), which switch to a glassmorphism surface
 * whenever Background Blur is enabled.
 *
 * Displays the current state and calls onChange when the user
 * toggles the setting.
 */
function Toggle({
                    checked,
                    onChange,
                    label,
                }: {
    checked: boolean;
    onChange: () => void;
    label: string;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5 text-[15px] font-medium text-[var(--text-deep)]">
            <span>{label}</span>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={onChange}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked
                        ? "toggle-track toggle-track-on"
                        : "toggle-track"
                }`}
            >
                <span
                    className={`toggle-thumb absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition ${
                        checked ? "left-[22px]" : "left-0.5"
                    }`}
                />
            </button>
        </label>
    );
}

/**
 * Reusable numeric stepper used for timer settings.
 *
 * Provides:
 * - A directly editable numeric input.
 * - Dedicated increment/decrement buttons outside the input.
 * - A small reset button that restores the original timer value.
 *
 * The value is clamped between the configured minimum and maximum.
 */
function NumberField({
                         label,
                         value,
                         onChange,
                         defaultValue,
                         min = 1,
                         max = 120,
                     }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    defaultValue: number;
    min?: number;
    max?: number;
}) {
    const increment = () => {
        onChange(Math.min(max, value + 1));
    };

    const decrement = () => {
        onChange(Math.max(min, value - 1));
    };

    const reset = () => {
        onChange(defaultValue);
    };

    const isDefault = value === defaultValue;

    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <span className="text-[15px] font-medium text-[var(--text-deep)]">
                {label}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
                {/* Numeric value and dedicated step controls. */}
                <div className="flex items-stretch">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => {
                            const n = Number(e.target.value);

                            if (!Number.isNaN(n)) {
                                onChange(
                                    Math.min(
                                        max,
                                        Math.max(min, n),
                                    ),
                                );
                            }
                        }}
                        aria-label={label}
                        className="input-surface w-14 rounded-l-md rounded-r-none border-r-0 px-2 py-1.5 text-right font-mono text-[14px] font-semibold focus:outline-none"
                    />

                    <div className="flex w-6 flex-col">
                        <button
                            type="button"
                            onClick={increment}
                            disabled={value >= max}
                            aria-label={`Increase ${label}`}
                            title={`Increase ${label}`}
                            className="btn-surface flex h-[17px] items-center justify-center rounded-tr-md border-l-0 text-[var(--text)] transition hover:text-[var(--text-deep)] disabled:pointer-events-none disabled:opacity-25"
                        >
                            <ChevronUp size={13} strokeWidth={2.5} />
                        </button>

                        <button
                            type="button"
                            onClick={decrement}
                            disabled={value <= min}
                            aria-label={`Decrease ${label}`}
                            title={`Decrease ${label}`}
                            className="btn-surface flex h-[17px] items-center justify-center rounded-br-md border-l-0 text-[var(--text)] transition hover:text-[var(--text-deep)] disabled:pointer-events-none disabled:opacity-25"
                        >
                            <ChevronDown size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Reset is intentionally subtle when the value is already default. */}
                <button
                    type="button"
                    onClick={reset}
                    disabled={isDefault}
                    aria-label={`Reset ${label}`}
                    title={`Reset ${label} to default`}
                    className="btn-ghost flex h-7 w-7 items-center justify-center rounded-md text-[var(--text)] transition hover:text-[var(--text-deep)] disabled:pointer-events-none disabled:opacity-20"
                >
                    <RotateCcw size={13} />
                </button>
            </div>
        </div>
    );
}

/**
 * Shared section heading used to maintain a consistent visual
 * hierarchy throughout the Settings panel.
 */
function SectionHeading({
                            children,
                        }: {
    children: ReactNode;
}) {
    return (
        <h3 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--text)]">
            {children}
        </h3>
    );
}

interface Props {
    onClose: () => void;
}

/**
 * Settings panel for configuring the application's appearance,
 * window behavior, module visibility, and Pomodoro timer.
 */
export function SettingsPanel({ onClose }: Props) {
    // Reads the current application settings from the Zustand store.
    const settings = useAppStore((s) => s.settings);

    // Reads the current Pomodoro cycle number.
    const cycle = useAppStore((s) => s.cycle);

    // Updates the window transparency percentage.
    const setOpacity = useAppStore((s) => s.setOpacity);

    // Toggles the native background blur effect.
    const toggleBlurBackground = useAppStore(
        (s) => s.toggleBlurBackground,
    );

    // Toggles visibility of the slime sprite animation.
    const toggleShowSlime = useAppStore(
        (s) => s.toggleShowSlime,
    );

    // Toggles visibility of the Timer module.
    const toggleShowTimer = useAppStore(
        (s) => s.toggleShowTimer,
    );

    // Toggles visibility of the to-do list.
    const toggleShowTodo = useAppStore(
        (s) => s.toggleShowTodo,
    );

    // Toggles chiptune sound effects.
    const toggleSound = useAppStore(
        (s) => s.toggleSound,
    );

    // Toggles desktop notifications.
    const toggleNotifications = useAppStore(
        (s) => s.toggleNotifications,
    );

    // Toggles the native Always on Top window state.
    const toggleAlwaysOnTop = useAppStore(
        (s) => s.toggleAlwaysOnTop,
    );

    // Updates one or more Pomodoro timer settings.
    const updateTimerSettings = useAppStore(
        (s) => s.updateTimerSettings,
    );

    // Resets the current Pomodoro cycle counter to cycle one.
    const resetCycles = useAppStore(
        (s) => s.resetCycles,
    );

    // Selects the active visual theme.
    const setTheme = useAppStore((s) => s.setTheme);

    // Every theme available for selection, sourced from the central registry.
    const themes = getThemes();

    return (
        <div
            /*
             * Fixed, fully opaque surface — independent of the user's
             * transparency slider, so Settings can never bleed content through.
             *
             * Scrolling is handled by the inner content container so the
             * header remains visible while navigating the settings.
             */
            className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-cozy bg-[var(--surface)] text-[var(--text-deep)] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
            {/* Settings header remains visible while the content scrolls. */}
            <div className="z-10 flex shrink-0 items-center justify-between bg-[var(--surface)] px-5 py-3">
                <h2 className="font-display text-lg font-bold text-[var(--text-deep)]">
                    Settings
                </h2>

                {/* .btn-surface provides the neutral control surface,
                    including its glassmorphism variant when Background
                    Blur is enabled. */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close settings"
                    title="Close settings"
                    className="btn-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text)] transition active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable settings content. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">
                <div className="flex flex-col gap-4">

                    {/* Appearance */}
                    <section className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <SectionHeading>
                            Appearance
                        </SectionHeading>

                        <div className="divide-y divide-white/10">
                            {/* Theme */}
                            <label className="flex items-center justify-between gap-4 py-2.5 text-[15px] font-medium text-[var(--text-deep)]">
                                <span>Theme</span>

                                <select
                                    value={settings.themeId}
                                    onChange={(e) =>
                                        setTheme(e.target.value)
                                    }
                                    aria-label="Application theme"
                                    className="input-surface max-w-[140px] rounded-md px-2 py-1.5 text-[14px] font-semibold focus:outline-none"
                                >
                                    {themes.map((theme) => (
                                        <option
                                            key={theme.id}
                                            value={theme.id}
                                            /*
                                             * Native <option> popups are rendered
                                             * by the OS/browser, not by our CSS
                                             * variables, so a fixed dark-on-light
                                             * pairing keeps every theme's option
                                             * list readable regardless of which
                                             * theme happens to be active.
                                             */
                                            className="bg-white text-black"
                                        >
                                            {theme.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Window opacity */}
                            <div className="py-2.5">
                                <div className="flex items-center justify-between text-[15px]">
                                    <span className="font-medium text-[var(--text-deep)]">
                                        Window opacity
                                    </span>

                                    <span
                                        className={`font-mono text-[15px] font-bold ${
                                            settings.blurBackground
                                                ? "text-[var(--text-deep)]/40"
                                                : "text-[var(--text-deep)]"
                                        }`}
                                    >
                                        {settings.opacity}%
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={25}
                                    value={settings.opacity}
                                    onChange={(e) =>
                                        setOpacity(
                                            Number(e.target.value),
                                        )
                                    }
                                    disabled={settings.blurBackground}
                                    className="mt-2 w-full accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Window opacity"
                                    aria-disabled={
                                        settings.blurBackground
                                    }
                                />

                                {settings.opacity <= 50 && (
                                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--text)]/70">
                                        Lower transparency may make the
                                        interface harder to read.
                                    </p>
                                )}
                            </div>

                            {/* Background blur */}
                            <div className="py-0.5">
                                <Toggle
                                    checked={settings.blurBackground}
                                    onChange={
                                        toggleBlurBackground
                                    }
                                    label="Background blur"
                                />

                                {settings.blurBackground && (
                                    <p className="-mt-1 pb-2 text-[13px] leading-relaxed text-[var(--text)]/70">
                                        Blur mode uses a translucent
                                        window surface.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Modules */}
                    <section className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <SectionHeading>
                            Modules
                        </SectionHeading>

                        <div className="divide-y divide-white/10">
                            <Toggle
                                checked={settings.showSlime}
                                onChange={toggleShowSlime}
                                label="Show slime animation"
                            />

                            <Toggle
                                checked={settings.showTimer}
                                onChange={toggleShowTimer}
                                label="Show timer"
                            />

                            <Toggle
                                checked={settings.showTodo}
                                onChange={toggleShowTodo}
                                label="Show to-do list"
                            />
                        </div>
                    </section>

                    {/* Window */}
                    <section className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <SectionHeading>
                            Window
                        </SectionHeading>

                        <div className="divide-y divide-white/10">
                            {/* Always on top */}
                            <Toggle
                                checked={settings.alwaysOnTop}
                                onChange={toggleAlwaysOnTop}
                                label="Always on top"
                            />

                            {/* Window position */}
                            <div className="py-2.5">
                                <span className="mb-2 block text-[15px] font-medium text-[var(--text-deep)]">
                                    Window position
                                </span>

                                <div className="grid grid-cols-3 gap-1.5">
                                    {SNAP_POSITIONS.map((pos) => (
                                        <button
                                            key={pos.id}
                                            type="button"
                                            onClick={() =>
                                                void snapWindow(
                                                    pos.id,
                                                )
                                            }
                                            className="btn-surface rounded-lg px-1 py-2.5 text-[12px] font-medium text-[var(--text-deep)] transition active:scale-[0.98]"
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* General */}
                    <section className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <SectionHeading>
                            General
                        </SectionHeading>

                        <div className="divide-y divide-white/10">
                            <Toggle
                                checked={settings.soundEnabled}
                                onChange={toggleSound}
                                label="Chiptune sound effects"
                            />

                            <Toggle
                                checked={
                                    settings.notificationsEnabled
                                }
                                onChange={toggleNotifications}
                                label="Desktop notifications"
                            />
                        </div>
                    </section>

                    {/* Timer */}
                    <section className="rounded-lg bg-white/[0.03] px-3 py-2">
                        <SectionHeading>
                            Timer
                        </SectionHeading>

                        <div className="divide-y divide-white/10">
                            {/* Timer durations */}
                            <div className="py-1">
                                <NumberField
                                    label="Focus"
                                    value={
                                        settings.timer.focusMinutes
                                    }
                                    defaultValue={
                                        DEFAULT_TIMER_SETTINGS.focusMinutes
                                    }
                                    onChange={(n) =>
                                        updateTimerSettings({
                                            focusMinutes: n,
                                        })
                                    }
                                />

                                <NumberField
                                    label="Short break"
                                    value={
                                        settings.timer
                                            .shortBreakMinutes
                                    }
                                    defaultValue={
                                        DEFAULT_TIMER_SETTINGS.shortBreakMinutes
                                    }
                                    onChange={(n) =>
                                        updateTimerSettings({
                                            shortBreakMinutes: n,
                                        })
                                    }
                                />

                                <NumberField
                                    label="Long break"
                                    value={
                                        settings.timer
                                            .longBreakMinutes
                                    }
                                    defaultValue={
                                        DEFAULT_TIMER_SETTINGS.longBreakMinutes
                                    }
                                    onChange={(n) =>
                                        updateTimerSettings({
                                            longBreakMinutes: n,
                                        })
                                    }
                                />

                                <NumberField
                                    label="Focus cycles before long break"
                                    value={
                                        settings.timer
                                            .cyclesBeforeLongBreak
                                    }
                                    defaultValue={
                                        DEFAULT_TIMER_SETTINGS.cyclesBeforeLongBreak
                                    }
                                    onChange={(n) =>
                                        updateTimerSettings({
                                            cyclesBeforeLongBreak: n,
                                        })
                                    }
                                    min={1}
                                    max={12}
                                />
                            </div>

                            {/* Auto-start next session */}
                            <div className="py-0.5">
                                <Toggle
                                    checked={
                                        settings.timer.autoStartNext
                                    }
                                    onChange={() =>
                                        updateTimerSettings({
                                            autoStartNext:
                                                !settings.timer
                                                    .autoStartNext,
                                        })
                                    }
                                    label="Auto-start next session"
                                />
                            </div>

                            {/* Pomodoro cycle */}
                            <div className="py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-[15px] font-semibold text-[var(--text-deep)]">
                                            Pomodoro cycle
                                        </h3>

                                        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text)]/70">
                                            Current cycle:{" "}
                                            <span className="font-mono text-[14px] font-bold text-[var(--text-deep)]">
                                                {cycle}
                                            </span>
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={resetCycles}
                                        aria-label="Reset Pomodoro cycles"
                                        title="Reset Pomodoro cycles"
                                        className="btn-surface flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-semibold text-[var(--text-deep)] transition active:scale-[0.98]"
                                    >
                                        <RotateCcw size={15} />
                                        Reset cycles
                                    </button>
                                </div>

                                <p className="mt-2 text-[13px] leading-relaxed text-[var(--text)]/70">
                                    Resets the cycle counter to 1
                                    without changing the current
                                    timer.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Pin Mode shortcut */}
                    <section className="rounded-lg bg-[var(--accent)] p-3">
                        <p className="text-center text-[13px] leading-relaxed text-[var(--on-accent)]">
                            To disable Pin Mode, use{" "}
                            <strong className="font-mono font-bold">
                                Ctrl+Shift+U
                            </strong>{" "}
                            (
                            <strong className="font-mono font-bold">
                                Cmd+Shift+U
                            </strong>{" "}
                            on macOS).
                        </p>
                    </section>

                    {/* Application version */}
                    <p className="text-center text-[10px] text-[var(--text)]/40">
                        slimy.doro v1.1
                    </p>
                </div>
            </div>
        </div>
    );
}