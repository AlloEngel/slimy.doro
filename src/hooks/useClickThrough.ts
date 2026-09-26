import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { setPinMode, isTauri } from "@/lib/tauri";

/**
 * Controls Pin Mode independently from the Always on Top preference.
 *
 * Pin Mode only controls whether the window ignores mouse events.
 * Always on Top is managed by App.tsx and the application settings store.
 */
export function useClickThrough(_alwaysOnTop: boolean) {
  const [pinned, setPinned] = useState(false);

  // Keeps the latest Pin Mode value available to callbacks.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  /*
   * Changes Pin Mode without modifying Always on Top.
   */
  const setPin = useCallback(async (next: boolean) => {
    setPinned(next);
    await setPinMode(next);
  }, []);

  /*
   * Toggles Pin Mode based on the current pinned state.
   */
  const togglePin = useCallback(() => {
    void setPin(!pinnedRef.current);
  }, [setPin]);

  /*
   * Listens for the native emergency-unpin shortcut.
   *
   * The Rust handler already restores mouse interaction.
   * React only needs to synchronize its local Pin state.
   *
   * Always on Top is intentionally not touched here.
   */
  useEffect(() => {
    if (!isTauri) return;

    let unlisten: (() => void) | undefined;

    void getCurrentWindow()
        .listen("shortcut://force-unpin", () => {
          /*
           * The native shortcut has already disabled
           * click-through at the window level.
           */
          setPinned(false);
        })
        .then((fn) => {
          unlisten = fn;
        });

    return () => {
      unlisten?.();
    };
  }, []);

  return {
    pinned,
    togglePin,
    setPin,
  };
}