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

/*
 * Native window dimensions.
 *
 * The native Tauri window is intentionally kept larger than the
 * CSS-scaled visual interface. The .app-scale classes handle the
 * visual scaling inside this native area.
 *
 * App.tsx is the source of truth for the runtime window size.
 * The window-state plugin only restores the position.
 */
const NATIVE_WIDTH = 231;
const NATIVE_HEIGHT_WITH_TODO = 382;
const NATIVE_HEIGHT_WITHOUT_TODO = 230;

/**
 * Main application component.
 *
 * Responsible for:
 * - Hydrating persisted application state.
 * - Synchronizing the native window size with the current layout.
 * - Restoring the persisted Always on Top preference.
 * - Handling window dragging.
 * - Rendering the main Pomodoro interface and Settings panel.
 */
export default function App() {
    // Indicates whether persisted application data has finished loading.
    const hydrated = useAppStore((s) => s.hydrated);

    // Loads persisted application state from storage.
    const hydrate = useAppStore((s) => s.hydrate);

    // Reads the persisted application settings.
    const settings = useAppStore((s) => s.settings);

    // Controls whether the Settings panel is currently visible.
    const [settingsOpen, setSettingsOpen] = useState(false);

    /*
     * Click-through state.
     *
     * Always on Top is passed to the hook because the emergency
     * unpin shortcut temporarily disables native Always on Top.
     * The hook restores the user's persisted preference afterward.
     */
    const { pinned, togglePin, setPin } = useClickThrough(
        settings.alwaysOnTop,
    );

    // Provides native window dragging from non-interactive surfaces.
    const handleDragStart = useWindowDrag();

    // Runs the Pomodoro timer ticker.
    usePomodoroTicker();

    /**
     * Hydrates persisted application data once when the app starts.
     */
    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    /**
     * Applies the persisted Always on Top preference to the native window.
     *
     * This runs after hydration so the native window reflects the saved
     * setting instead of relying only on the value from tauri.conf.json.
     */
    useEffect(() => {
        if (!hydrated) return;

        void setAlwaysOnTop(settings.alwaysOnTop);
    }, [hydrated, settings.alwaysOnTop]);

    /**
     * Synchronizes the native window size with the current layout.
     *
     * The to-do list requires the taller window. When it is hidden,
     * the window shrinks back to the compact Pomodoro size.
     *
     * The explicit dimensions here prevent an old window-state size
     * from determining the actual application layout.
     */
    useEffect(() => {
        if (!hydrated) return;

        const height = settings.showTodo
            ? NATIVE_HEIGHT_WITH_TODO
            : NATIVE_HEIGHT_WITHOUT_TODO;

        // Keep the native width fixed for both layouts.
        void setWindowWidth(NATIVE_WIDTH);

        // Adjust only the height that changes with the to-do list.
        void setWindowHeight(height);
    }, [hydrated, settings.showTodo]);

    /*
     * While persisted data is loading, render a transparent surface.
     *
     * This prevents the main interface from briefly appearing with
     * default values before the stored settings are available.
     */
    if (!hydrated) {
        return <div className="h-full w-full bg-transparent" />;
    }

    // Converts the saved opacity preset into the visual contrast mode.
    const contrastMode = resolveContrastMode(settings.opacity);

    // Converts the saved opacity value into the alpha used by the surface.
    const alpha = opacityToAlpha(settings.opacity);

    /*
     * The CSS scale differs depending on whether the to-do list is visible.
     *
     * Both classes preserve the same visual proportions while allowing
     * the native window to use the dimensions defined above.
     */
    const appScaleClass = settings.showTodo
        ? "app-scale"
        : "app-scale-no-todo";

    return (
        <div className={appScaleClass}>
            <div
                className={`relative h-full w-full overflow-hidden rounded-cozy contrast-${contrastMode}`}
                style={{
                    /*
                     * The main surface respects the user's transparency
                     * preference while keeping the Settings panel itself
                     * opaque.
                     */
                    backgroundColor: `color-mix(in srgb, var(--surface) ${alpha * 100}%, transparent)`,

                    // Adds the blurred glass-like background effect.
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",

                    // Gives the compact floating window visual separation.
                    boxShadow:
                        "0 18px 40px rgba(0, 0, 0, 0.45)",
                }}
                onMouseDown={handleDragStart}
            >
                {/* Native-style window controls. */}
                <TitleBarControls
                    pinned={pinned}
                    onTogglePin={togglePin}
                    onOpenSettings={() => setSettingsOpen(true)}
                />

                {/*
                 * Main application content.
                 *
                 * The interface is hidden while Settings is open so
                 * the Settings panel can occupy the complete window.
                 */}
                {!settingsOpen && (
                    <div className="flex h-full w-full flex-col gap-8 px-4 pb-2 pt-8">
                        <div
                            className={`flex min-h-0 flex-col items-center gap-1 ${
                                !settings.showTodo
                                    ? "flex-1 justify-center"
                                    : ""
                            }`}
                        >
                            {/* Animated slime companion. */}
                            <SlimeStage />

                            {/* Current Pomodoro mode, cycle and time. */}
                            <TimerDisplay />
                        </div>

                        {/* Optional compact to-do list. */}
                        {settings.showTodo && <TodoList />}
                    </div>
                )}

                {/*
                 * Settings is rendered over the complete application
                 * surface and has its own scrolling behavior.
                 */}
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