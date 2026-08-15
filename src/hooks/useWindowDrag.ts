import { useCallback, type MouseEvent } from "react";
import { startWindowDrag } from "@/lib/tauri";

/**
 * There is no native titlebar, so any "chrome" surface (the top strip,
 * the empty space around the timer) doubles as a drag handle. Attach
 * the returned handler to `onMouseDown` on that surface only — never on
 * interactive controls like buttons or inputs.
 */
export function useWindowDrag() {
  return useCallback((event: MouseEvent) => {
    // Only primary button, and don't hijack clicks on real controls.
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, a, [data-no-drag]")) return;
    void startWindowDrag();
  }, []);
}
