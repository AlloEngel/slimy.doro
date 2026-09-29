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
  const cyclesTarget = useAppStore(
      (s) => s.settings.timer.cyclesBeforeLongBreak,
  );
  const startPause = useAppStore((s) => s.startPause);
  const resetSession = useAppStore((s) => s.resetSession);
  const skipSession = useAppStore((s) => s.skipSession);

  return (
      <div
          className="flex w-full flex-col items-center gap-2"
          data-no-drag
      >
        <div className="font-mono text-[47px] font-bold leading-none tracking-tight tabular-nums text-current">
          {formatTime(secondsLeft)}
        </div>

        <div className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.18em] text-current/70">
      <span>
        Cycle {cycle}/{cyclesTarget}
      </span>

          <span aria-hidden>&middot;</span>

          <span>{MODE_LABEL[mode]}</span>
        </div>

        <div className="mt-1 flex items-center gap-2 px-3">
          {/* .btn-surface provides the neutral surface, including its
              glassmorphism variant when Background Blur is enabled. */}
          <button
              type="button"
              onClick={resetSession}
              className="btn-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-current transition active:scale-95"
              aria-label="Cancel and reset session"
              title="Cancel session"
          >
            <RotateCcw size={20} strokeWidth={2.25} />
          </button>

          {/* .btn-primary provides the accent CTA surface, including its
              glassmorphism variant when Background Blur is enabled. */}
          <button
              type="button"
              onClick={startPause}
              className="btn-primary flex h-[3.1rem] w-44 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono text-base font-bold uppercase tracking-wide transition active:scale-[0.98]"
              aria-label={isRunning ? "Pause session" : "Start session"}
          >
            {isRunning ? (
                <Pause size={18} fill="currentColor" />
            ) : (
                <Play size={18} fill="currentColor" />
            )}

            {isRunning ? "Pause" : "Start Session"}
          </button>

          <button
              type="button"
              onClick={skipSession}
              className="btn-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-current transition active:scale-95"
              aria-label="Skip to next session"
              title="Skip session"
          >
            <SkipForward size={20} strokeWidth={2.25} />
          </button>
        </div>
      </div>
  );
}