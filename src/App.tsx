import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePomodoroTicker } from "@/hooks/usePomodoroTicker";
import { useClickThrough } from "@/hooks/useClickThrough";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { useDrawerWindowSync } from "@/hooks/useDrawerWindowSync";
import { resolveContrastMode, opacityToAlpha } from "@/lib/theme";
import { SlimeStage } from "@/components/SlimeStage";
import { TimerDisplay } from "@/components/TimerDisplay";
import { TitleBarControls } from "@/components/TitleBarControls";
import { TodoCompact } from "@/components/TodoCompact";
import { TodoDrawer } from "@/components/TodoDrawer";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const settings = useAppStore((s) => s.settings);
  const todoExpanded = useAppStore((s) => s.todoExpanded);
  const toggleTodoExpanded = useAppStore((s) => s.toggleTodoExpanded);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pinned, togglePin } = useClickThrough();
  const handleDragStart = useWindowDrag();

  usePomodoroTicker();
  useDrawerWindowSync(settings.showTodo && todoExpanded);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    // Avoid a flash of default-settings UI before persisted state loads.
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

      <div className="flex h-full w-full">
        {settings.showTodo &&
          (todoExpanded ? (
            <TodoDrawer onCollapse={toggleTodoExpanded} />
          ) : (
            <TodoCompact onExpand={toggleTodoExpanded} />
          ))}

        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          <SlimeStage />
          <TimerDisplay />
        </div>
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
