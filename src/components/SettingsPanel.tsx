import { ShieldAlert, X } from "lucide-react";
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
    return (
        <label className="flex cursor-pointer items-center justify-between py-1.5 text-[12px] text-current/90">
            <span>{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[var(--accent)]" : "bg-white/15"}`}
            >
        <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                checked ? "left-[18px]" : "left-0.5"
            }`}
        />
            </button>
        </label>
    );
}

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
        <label className="flex items-center justify-between py-1 text-[12px] text-current/90">
            <span>{label}</span>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
                }}
                className="w-14 rounded-md bg-white/10 px-2 py-1 text-right font-mono text-[12px] text-current focus:bg-white/15 focus:outline-none"
            />
        </label>
    );
}

interface Props {
    onClose: () => void;
    onForceUnpin: () => void;
}

export function SettingsPanel({ onClose, onForceUnpin }: Props) {
    const settings = useAppStore((s) => s.settings);
    const setOpacity = useAppStore((s) => s.setOpacity);
    const toggleShowTodo = useAppStore((s) => s.toggleShowTodo);
    const toggleSound = useAppStore((s) => s.toggleSound);
    const toggleNotifications = useAppStore((s) => s.toggleNotifications);
    const toggleAlwaysOnTop = useAppStore((s) => s.toggleAlwaysOnTop);
    const updateTimerSettings = useAppStore((s) => s.updateTimerSettings);

    return (
        <div
            // Fixed, fully opaque dark surface — independent of the user's
            // transparency slider, so Settings can never bleed content through.
            className="absolute inset-0 z-30 flex flex-col gap-3 overflow-y-auto rounded-cozy bg-[#12151d] p-4 text-[var(--text-deep)] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
            data-no-drag
        >
            <div className="flex items-center justify-between">
                <h2 className="font-display text-[10px] text-[var(--text-deep)]">Settings</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close settings"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[var(--text)] hover:bg-white/15"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Always on Top — first item, per requirement #3 */}
            <section className="rounded-lg bg-white/5 px-2.5 py-1">
                <Toggle checked={settings.alwaysOnTop} onChange={toggleAlwaysOnTop} label="Always on top" />
            </section>

            <section>
                <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text)]/70">
                        Transparency
                    </h3>
                    <span className="font-mono text-[10px] text-[var(--text)]/70">{settings.opacity}%</span>
                </div>
                <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={settings.opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                    aria-label="Window opacity"
                />
            </section>

            <section>
                <h3 className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text)]/70">
                    Window position
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                    {SNAP_POSITIONS.map((pos) => (
                        <button
                            key={pos.id}
                            type="button"
                            onClick={() => void snapWindow(pos.id)}
                            className="rounded-lg bg-white/5 py-1.5 text-[10px] text-[var(--text)] hover:bg-white/10"
                        >
                            {pos.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="divide-y divide-white/5">
                <Toggle checked={settings.showTodo} onChange={toggleShowTodo} label="Show to-do list" />
                <Toggle checked={settings.soundEnabled} onChange={toggleSound} label="Chiptune sound effects" />
                <Toggle
                    checked={settings.notificationsEnabled}
                    onChange={toggleNotifications}
                    label="Desktop notifications"
                />
            </section>

            <section>
                <h3 className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text)]/70">
                    Timer durations (minutes)
                </h3>
                <NumberField
                    label="Focus"
                    value={settings.timer.focusMinutes}
                    onChange={(n) => updateTimerSettings({ focusMinutes: n })}
                />
                <NumberField
                    label="Short break"
                    value={settings.timer.shortBreakMinutes}
                    onChange={(n) => updateTimerSettings({ shortBreakMinutes: n })}
                />
                <NumberField
                    label="Long break"
                    value={settings.timer.longBreakMinutes}
                    onChange={(n) => updateTimerSettings({ longBreakMinutes: n })}
                />
                <NumberField
                    label="Focus cycles before long break"
                    value={settings.timer.cyclesBeforeLongBreak}
                    onChange={(n) => updateTimerSettings({ cyclesBeforeLongBreak: n })}
                    min={1}
                    max={12}
                />
                <Toggle
                    checked={settings.timer.autoStartNext}
                    onChange={() => updateTimerSettings({ autoStartNext: !settings.timer.autoStartNext })}
                    label="Auto-start next session"
                />
            </section>

            <section className="rounded-lg bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-2.5">
                <button
                    type="button"
                    onClick={onForceUnpin}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--accent)] py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--on-accent)] transition hover:brightness-105 active:scale-[0.98]"
                >
                    <ShieldAlert size={13} />
                    Force Unpin Window
                </button>
                <p className="mt-1.5 text-center text-[10px] text-[var(--text)]/60">
                    Also available via tray menu, or Ctrl+Shift+U (Cmd+Shift+U on macOS)
                    — works even if the window is stuck click-through.
                </p>
            </section>
        </div>
    );
}