import { useCallback, type MouseEvent } from "react";
import { startWindowDrag } from "@/lib/tauri";

/**
 * There is no native titlebar, so any non-interactive surface can
 * also act as a drag handle for the native window.
 *
 * Interactive controls are excluded so clicking buttons, inputs,
 * labels, links, or explicitly protected areas does not start
 * a window drag.
 */
export function useWindowDrag() {
  return useCallback((event: MouseEvent) => {
    // Only primary mouse button can start a window drag.
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;

    // Do not hijack interaction with real controls or protected areas.
    if (
        target.closest(
            "button, input, textarea, a, label, [data-no-drag]",
        )
    ) {
      return;
    }

    // Start dragging the native Tauri window.
    void startWindowDrag();
  }, []);
}