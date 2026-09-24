
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePomodoroTicker } from "@/hooks/usePomodoroTicker";
import { useClickThrough } from "@/hooks/useClickThrough";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { resolveContrastMode, opacityToAlpha } from "@/lib/theme";
import { SlimeStage } from "@/components/SlimeStage";
import { TimerDisplay } from "@/components/TimerDisplay";
import { TitleBarControls } from "@/components/TitleBarControls";
import { TodoList } from "@/components/TodoList";
import { SettingsPanel } from "@/components/SettingsPanel";


export default function App() {
    const hydrated = useAppStore((s) => s.hydrated);
    const hydrate = useAppStore((s) => s.hydrate);
    const settings = useAppStore((s) => s.settings);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const { pinned, togglePin, setPin } = useClickThrough();
    const handleDragStart = useWindowDrag();

    usePomodoroTicker();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    if (!hydrated) {
        return <div className="h-full w-full bg-transparent" />;
    }

    const contrastMode = resolveContrastMode(settings.opacity);
    const alpha = opacityToAlpha(settings.opacity);

    return (
        <div className="app-scale">
            <div
                className={`relative h-full w-full overflow-hidden rounded-cozy contrast-${contrastMode}`}
                style={{
                    backgroundColor: `color-mix(in srgb, var(--surface) ${alpha * 100}%, transparent)`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
                }}
                onMouseDown={handleDragStart}
            >
                <TitleBarControls
                    pinned={pinned}
                    onTogglePin={togglePin}
                    onOpenSettings={() => setSettingsOpen(true)}
                />

                {!settingsOpen && (
                    <div className="flex h-full w-full flex-col gap-3 px-3 pb-3 pt-10">
                        {/* When the To-Do list is hidden, this block becomes flex-1 +
                        justify-center so the slime/timer expand to fill the freed
                        vertical space instead of leaving a blank gap below them.
                        */}
                        <div
                            className={`flex flex-col items-center gap-2 ${
                                !settings.showTodo ? "flex-1 justify-center" : ""
                            }`}
                        >
                            <SlimeStage />
                            <TimerDisplay />
                        </div>

                        {settings.showTodo && <TodoList />}
                    </div>
                )}

                {settingsOpen && (
                    <SettingsPanel
                        onClose={() => setSettingsOpen(false)}
                        onForceUnpin={() => void setPin(false)}
                    />
                )}
            </div>
        </div>
    );
}