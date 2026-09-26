import { type ReactNode } from "react";
import { RotateCcw, ShieldAlert, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { snapWindow } from "@/lib/tauri";
import type { SnapPosition } from "@/types";

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
                        ? "bg-[var(--accent)]"
                        : "bg-white/15 hover:bg-white/20"
                }`}
            >
                <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        checked ? "left-[22px]" : "left-0.5"
                    }`}
                />
            </button>
        </label>
    );
}

/**
 * Reusable numeric input used for timer settings.
 *
 * Clamps the entered value between the configured minimum
 * and maximum before passing it to the parent component.
 */
function NumberField({
                         label,
                         value,
                         onChange,
                         min = 1,
                         max = 120,
                     }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    min?: number;
    max?: number;
}) {
    return (
        <label className="flex items-center justify-between gap-4 py-2 text-[15px] font-medium text-[var(--text-deep)]">
            <span>{label}</span>

            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const n = Number(e.target.value);

                    if (!Number.isNaN(n)) {
                        onChange(
                            Math.min(max, Math.max(min, n)),
                        );
                    }
                }}
                className="w-16 rounded-md bg-white/10 px-2 py-1.5 text-right font-mono text-[14px] font-semibold text-[var(--text-deep)] focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
        </label>
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
    onForceUnpin: () => void;
}

/**
 * Settings panel for configuring the application's appearance,
 * window behavior, general features, and Pomodoro timer.
 */
export function SettingsPanel({
                                  onClose,
                                  onForceUnpin,
                              }: Props) {
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

    return (
        <div
            // Fixed, fully opaque surface — independent of the user's
            // transparency slider, so Settings can never bleed content through.
            className="absolute inset-0 z-30 flex flex-col gap-4 overflow-y-auto rounded-cozy bg-[var(--surface)] p-5 text-[var(--text-deep)] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[var(--text-deep)]">
                    Settings
                </h2>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close settings"
                    title="Close settings"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--text)] transition hover:bg-white/15 active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Window behavior */}
            <section className="rounded-lg bg-white/[0.03] px-3 py-1">
                <Toggle
                    checked={settings.alwaysOnTop}
                    onChange={toggleAlwaysOnTop}
                    label="Always on top"
                />
            </section>

            {/* Transparency */}
            <section>
                <SectionHeading>
                    Transparency
                </SectionHeading>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[15px]">
                        <span className="font-medium text-[var(--text-deep)]">
                            Window opacity
                        </span>

                        <span className="font-mono text-[15px] font-bold text-[var(--text-deep)]">
                            {settings.opacity}%
                        </span>
                    </div>

                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={10}
                        value={settings.opacity}
                        onChange={(e) =>
                            setOpacity(
                                Number(e.target.value),
                            )
                        }
                        className="w-full accent-[var(--accent)]"
                        aria-label="Window opacity"
                    />

                    {/* Enables the native platform blur behind the window. */}
                    <Toggle
                        checked={settings.blurBackground}
                        onChange={toggleBlurBackground}
                        label="Background blur"
                    />

                    {/* Warns the user that lower transparency values can reduce readability. */}
                    {settings.opacity <= 50 && (
                        <p className="text-[13px] leading-relaxed text-[var(--text)]/70">
                            Lower transparency may make the
                            interface harder to read.
                        </p>
                    )}
                </div>
            </section>

            {/* Window Position */}
            <section>
                <SectionHeading>
                    Window position
                </SectionHeading>

                <div className="grid grid-cols-3 gap-1.5">
                    {SNAP_POSITIONS.map((pos) => (
                        <button
                            key={pos.id}
                            type="button"
                            onClick={() =>
                                void snapWindow(pos.id)
                            }
                            className="rounded-lg bg-white/5 px-1 py-2.5 text-[12px] font-medium text-[var(--text-deep)] transition hover:bg-white/10 active:scale-[0.98]"
                        >
                            {pos.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* General Toggles */}
            <section className="divide-y divide-white/10 rounded-lg bg-white/[0.03] px-3 py-1">
                <Toggle
                    checked={settings.showTodo}
                    onChange={toggleShowTodo}
                    label="Show to-do list"
                />

                <Toggle
                    checked={settings.soundEnabled}
                    onChange={toggleSound}
                    label="Chiptune sound effects"
                />

                <Toggle
                    checked={settings.notificationsEnabled}
                    onChange={toggleNotifications}
                    label="Desktop notifications"
                />
            </section>

            {/* Timer Durations */}
            <section>
                <SectionHeading>
                    Timer durations
                </SectionHeading>

                <div className="space-y-0.5">
                    <NumberField
                        label="Focus"
                        value={
                            settings.timer.focusMinutes
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
                        onChange={(n) =>
                            updateTimerSettings({
                                cyclesBeforeLongBreak: n,
                            })
                        }
                        min={1}
                        max={12}
                    />
                </div>

                <div className="mt-2 border-t border-white/10 pt-1">
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
            </section>

            {/* Cycle Reset */}
            <section className="rounded-lg bg-white/[0.03] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
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
                        className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-2 text-[13px] font-semibold text-[var(--text-deep)] transition hover:bg-white/15 active:scale-[0.98]"
                    >
                        <RotateCcw size={15} />
                        Reset cycles
                    </button>
                </div>

                <p className="text-[13px] leading-relaxed text-[var(--text)]/70">
                    Resets the cycle counter to 1 without
                    changing the current timer.
                </p>
            </section>

            {/* Force Unpin */}
            <section className="rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-3">
                <button
                    type="button"
                    onClick={onForceUnpin}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] py-2.5 text-[14px] font-bold uppercase tracking-wide text-[var(--on-accent)] transition hover:brightness-105 active:scale-[0.98]"
                >
                    <ShieldAlert size={17} />
                    Force Unpin Window
                </button>

                <p className="mt-2 text-center text-[13px] leading-relaxed text-[var(--text)]/75">
                    Also available via tray menu, or{" "}
                    <strong className="font-mono font-bold text-[var(--text-deep)]">
                        Ctrl+Shift+U
                    </strong>{" "}
                    (
                    <strong className="font-mono font-bold text-[var(--text-deep)]">
                        Cmd+Shift+U
                    </strong>{" "}
                    on macOS).
                </p>
            </section>
        </div>
    );
}