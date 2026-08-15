import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const MODE_LABEL: Record<string, string> = {
  focus: "FOCUS MODE",
  "short-break": "SHORT BREAK",
  "long-break": "LONG BREAK",
};

export function TimerDisplay() {
  const secondsLeft = useAppStore((s) => s.secondsLeft);
  const isRunning = useAppStore((s) => s.isRunning);
  const mode = useAppStore((s) => s.mode);
  const cycle = useAppStore((s) => s.cycle);
  const cyclesTarget = useAppStore((s) => s.settings.timer.cyclesBeforeLongBreak);
  const startPause = useAppStore((s) => s.startPause);
  const resetSession = useAppStore((s) => s.resetSession);
  const skipSession = useAppStore((s) => s.skipSession);

  return (
    <div className="flex w-full flex-col items-center gap-3" data-no-drag>
      <div className="font-mono text-[42px] font-bold leading-none tracking-tight tabular-nums text-current">
        {formatTime(secondsLeft)}
      </div>

      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-current/70">
        <span>
          Cycle {cycle}/{cyclesTarget}
        </span>
        <span aria-hidden>&middot;</span>
        <span>{MODE_LABEL[mode]}</span>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={resetSession}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-current transition hover:bg-black/10 active:scale-95"
          aria-label="Cancel and reset session"
          title="Cancel session"
        >
          <RotateCcw size={16} strokeWidth={2.25} />
        </button>

        <button
          type="button"
          onClick={startPause}
          className="flex h-14 w-40 items-center justify-center gap-2 rounded-full bg-slate-deep font-mono text-sm font-bold uppercase tracking-wide text-cream shadow-[0_6px_16px_rgba(51,59,77,0.28)] transition hover:brightness-110 active:scale-[0.98]"
          aria-label={isRunning ? "Pause session" : "Start session"}
        >
          {isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          {isRunning ? "Pause" : "Start Session"}
        </button>

        <button
          type="button"
          onClick={skipSession}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-current transition hover:bg-black/10 active:scale-95"
          aria-label="Skip to next session"
          title="Skip session"
        >
          <SkipForward size={16} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
