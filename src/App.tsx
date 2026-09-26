import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePomodoroTicker } from "@/hooks/usePomodoroTicker";
import { useClickThrough } from "@/hooks/useClickThrough";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { resolveContrastMode, opacityToAlpha } from "@/lib/theme";
import {
    setAlwaysOnTop,
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

/**
 * Main application component.
 *
 * Loads persisted application data, keeps the native window size
 * synchronized with the current layout, applies the saved
 * Always on Top state, and renders the main application interface.
 */
export default function App() {
    // Indicates whether persisted application data has finished loading.
    const hydrated = useAppStore((s) => s.hydrated);

    // Loads persisted settings and tasks from local storage.
    const hydrate = useAppStore((s) => s.hydrate);

    // Reads the current application settings from the store.
    const settings = useAppStore((s) => s.settings);

    // Controls whether the Settings panel is currently visible.
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Provides the native click-through/pin state and its controls.
    const { pinned, togglePin, setPin } = useClickThrough();

    // Handles dragging the native application window.
    const handleDragStart = useWindowDrag();

    // Starts and maintains the Pomodoro countdown.
    usePomodoroTicker();

    /**
     * Loads persisted settings and tasks when the application starts.
     */
    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    /**
     * Applies the current Always on Top preference to the native
     * window after hydration and whenever the preference changes.
     *
     * This keeps the native Tauri window synchronized with the
     * persisted Zustand setting.
     */
    useEffect(() => {
        if (!hydrated) return;

        void setAlwaysOnTop(settings.alwaysOnTop);
    }, [hydrated, settings.alwaysOnTop]);

    /**
     * Keeps the native window dimensions synchronized with whether
     * the Todo list is currently visible.
     */
    useEffect(() => {
        if (!hydrated) return;

        const height = settings.showTodo
            ? NATIVE_HEIGHT_WITH_TODO
            : NATIVE_HEIGHT_WITHOUT_TODO;

        void setWindowWidth(NATIVE_WIDTH);
        void setWindowHeight(height);
    }, [hydrated, settings.showTodo]);

    // Avoid rendering the application interface until persisted
    // settings and tasks have finished loading.
    if (!hydrated) {
        return <div className="h-full w-full bg-transparent" />;
    }

    // Determines the visual contrast mode from the current opacity.
    const contrastMode = resolveContrastMode(settings.opacity);

    // Converts the opacity preset into the alpha value used by the surface.
    const alpha = opacityToAlpha(settings.opacity);

    // Selects the appropriate logical layout size depending on
    // whether the Todo section is visible.
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
                    <div className="flex h-full w-full flex-col gap-8 px-4 pb-2 pt-8">
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