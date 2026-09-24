import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePomodoroTicker } from "@/hooks/usePomodoroTicker";
import { useClickThrough } from "@/hooks/useClickThrough";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { resolveContrastMode, opacityToAlpha } from "@/lib/theme";
import {
    setWindowHeight,
    setWindowWidth,
} from "@/lib/tauri";
import { SlimeStage } from "@/components/SlimeStage";
import { TimerDisplay } from "@/components/TimerDisplay";
import { TitleBarControls } from "@/components/TitleBarControls";
import { TodoList } from "@/components/TodoList";
import { SettingsPanel } from "@/components/SettingsPanel";

const NATIVE_WIDTH = 231;
const NATIVE_HEIGHT_WITH_TODO = 382;
const NATIVE_HEIGHT_WITHOUT_TODO = 230;

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

    useEffect(() => {
        if (!hydrated) return;

        const height = settings.showTodo
            ? NATIVE_HEIGHT_WITH_TODO
            : NATIVE_HEIGHT_WITHOUT_TODO;

        void setWindowWidth(NATIVE_WIDTH);
        void setWindowHeight(height);
    }, [hydrated, settings.showTodo]);

    if (!hydrated) {
        return <div className="h-full w-full bg-transparent" />;
    }

    const contrastMode = resolveContrastMode(settings.opacity);
    const alpha = opacityToAlpha(settings.opacity);

    const appScaleClass = settings.showTodo
        ? "app-scale"
        : "app-scale-no-todo";

    return (
        <div className={appScaleClass}>
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
                    <div className="flex h-full w-full flex-col gap-2 px-4 pb-2 pt-8">
                        <div
                            className={`flex min-h-0 flex-col items-center gap-1 ${
                                !settings.showTodo
                                    ? "flex-1 justify-center"
                                    : ""
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