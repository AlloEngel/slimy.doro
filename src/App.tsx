import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePomodoroTicker } from "@/hooks/usePomodoroTicker";
import { useClickThrough } from "@/hooks/useClickThrough";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { resolveContrastMode, opacityToAlpha } from "@/lib/theme";
import {
    setAlwaysOnTop,
    setBackgroundEffect,
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
    // Indicates whether persisted application data has finished loading.
    const hydrated = useAppStore((s) => s.hydrated);

    // Loads persisted settings and application data.
    const hydrate = useAppStore((s) => s.hydrate);

    // Reads the current application settings from the global store.
    const settings = useAppStore((s) => s.settings);

    // Controls whether the settings panel is currently visible.
    const [settingsOpen, setSettingsOpen] = useState(false);

    /*
     * Controls native click-through and Pin Mode behavior.
     *
     * The Always on Top setting is passed to the hook for API
     * compatibility, but its native synchronization is handled
     * separately below.
     */
    const { pinned, togglePin, setPin } = useClickThrough(
        settings.alwaysOnTop,
    );

    // Provides native window dragging for non-interactive areas.
    const handleDragStart = useWindowDrag();

    // Keeps the Pomodoro timer synchronized with elapsed real time.
    usePomodoroTicker();

    /*
     * Loads persisted application state when the application starts.
     */
    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    /*
     * Synchronizes native window effects after application settings
     * have been hydrated.
     *
     * The background effect is applied first and Always on Top is
     * applied afterwards so the final native window state explicitly
     * matches the user's persisted preference.
     */
    useEffect(() => {
        if (!hydrated) return;

        const synchronizeWindowState = async () => {
            /*
             * Apply the native background effect first.
             */
            await setBackgroundEffect(
                settings.blurBackground,
            );

            /*
             * Apply Always on Top last so it remains the final
             * native z-order state of the window.
             */
            await setAlwaysOnTop(
                settings.alwaysOnTop,
            );
        };

        void synchronizeWindowState();
    }, [
        hydrated,
        settings.blurBackground,
        settings.alwaysOnTop,
    ]);

    /*
     * Determines whether the application should currently use
     * the full-height layout.
     *
     * Settings always uses the full-height layout so changing
     * Show to-do list while the Settings panel is open does not
     * resize the visible application.
     */
    const useFullHeightLayout =
        settingsOpen || settings.showTodo;

    /*
     * Resizes the native window according to the currently visible
     * application state.
     *
     * While the Settings panel is open, the window intentionally
     * keeps the full to-do-list height. Once Settings is closed,
     * the height follows the Show to-do list setting again.
     *
     * These dimensions are logical pixels, which keeps the application
     * consistent across monitors using different DPI scaling.
     *
     * The slime visibility setting intentionally does not affect
     * the native window height. The available layout space is instead
     * redistributed by the React flex layout below.
     */
    useEffect(() => {
        if (!hydrated) return;

        const height = useFullHeightLayout
            ? NATIVE_HEIGHT_WITH_TODO
            : NATIVE_HEIGHT_WITHOUT_TODO;

        void setWindowWidth(NATIVE_WIDTH);
        void setWindowHeight(height);
    }, [
        hydrated,
        useFullHeightLayout,
    ]);

    /*
     * The application starts with a transparent WebView while persisted
     * settings are being loaded.
     */
    if (!hydrated) {
        return (
            <div className="h-full w-full bg-transparent" />
        );
    }

    // Resolves the appropriate text contrast mode.
    const contrastMode = resolveContrastMode(
        settings.opacity,
    );

    // Converts the opacity percentage into an alpha value.
    const alpha = opacityToAlpha(settings.opacity);

    /*
     * Selects the correct scaled layout.
     *
     * Settings uses the full-height layout even when the to-do list
     * has been disabled, preventing the Settings panel from shrinking.
     */
    const appScaleClass = useFullHeightLayout
        ? "app-scale"
        : "app-scale-no-todo";

    /*
     * When native blur is enabled, the WebView surface must remain
     * sufficiently translucent for the native material to be visible.
     *
     * The operating system performs the actual background blur.
     */
    const surfaceAlpha = settings.blurBackground
        ? Math.min(alpha * 100, 28)
        : alpha * 100;

    /*
     * Provides a subtle shadow around the application.
     *
     * No CSS border or inset highlight is applied here because the
     * native background effect already provides the window surface.
     */
    const glassShadow =
        "0 18px 40px rgba(0, 0, 0, 0.45)";

    return (
        <div className={appScaleClass}>
            <div
                className={`relative h-full w-full overflow-hidden rounded-cozy contrast-${contrastMode}`}
                style={{
                    /*
                     * The surface stays translucent so the native
                     * background effect can remain visible.
                     */
                    backgroundColor:
                        `color-mix(in srgb, var(--surface) ${surfaceAlpha}%, transparent)`,

                    /*
                     * CSS backdrop-filter is intentionally not used.
                     *
                     * It cannot reliably blur the actual desktop content
                     * outside the WebView/native window.
                     */
                    border: "none",

                    // Applies the application's visual depth.
                    boxShadow: glassShadow,
                }}
                onMouseDown={handleDragStart}
            >
                <TitleBarControls
                    pinned={pinned}
                    onTogglePin={togglePin}
                    onOpenSettings={() =>
                        setSettingsOpen(true)
                    }
                />

                {!settingsOpen && (
                    <div className="flex h-full w-full flex-col gap-8 px-4 pb-2 pt-8">
                        <div
                            /*
                             * When the Todo list is hidden, the main timer
                             * area already uses the available window height.
                             *
                             * The same flexible centering is also used when
                             * the slime is hidden, allowing the TimerDisplay
                             * to occupy the space left by the sprite instead
                             * of leaving an empty gap.
                             */
                            className={`flex min-h-0 flex-col items-center gap-1 ${
                                !settings.showTodo ||
                                !settings.showSlime
                                    ? "flex-1 justify-center"
                                    : ""
                            }`}
                        >
                            {settings.showSlime && (
                                <SlimeStage />
                            )}

                            <TimerDisplay />
                        </div>

                        {settings.showTodo && (
                            <TodoList />
                        )}
                    </div>
                )}

                {settingsOpen && (
                    <SettingsPanel
                        onClose={() =>
                            setSettingsOpen(false)
                        }
                        onForceUnpin={() =>
                            void setPin(false)
                        }
                    />
                )}
            </div>
        </div>
    );
}