import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/** Advances the timer once per second while a session is running. */
export function usePomodoroTicker() {
  const isRunning = useAppStore((s) => s.isRunning);
  const tick = useAppStore((s) => s.tick);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [isRunning, tick]);
}
