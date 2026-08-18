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
      <div
          className={`relative h-full w-full overflow-hidden rounded-cozy contrast-${contrastMode}`}
          style={{
            backgroundColor: `color-mix(in srgb, var(--surface) ${alpha * 100}%, transparent)`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 18px 40px rgba(30, 30, 30, 0.18)",
          }}
          onMouseDown={handleDragStart}
      >
        <TitleBarControls pinned={pinned} onTogglePin={togglePin} onOpenSettings={() => setSettingsOpen(true)} />

        {/* Main content fully UNMOUNTS while settings is open — this is
          what actually fixes the bleed-through bug, rather than
          relying on stacking/opacity to mask it. */}
        {!settingsOpen && (
            <div className="flex h-full w-full flex-col gap-3 px-3 pb-3 pt-10">
              <div className="flex flex-col items-center gap-2">
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
  );
}