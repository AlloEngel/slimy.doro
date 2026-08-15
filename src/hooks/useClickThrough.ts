import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { setPinMode, isTauri } from "@/lib/tauri";

/**
 * Pin mode makes the overlay window ignore all mouse events so clicks
 * pass through to whatever app is behind it. The window itself can't
 * un-pin itself from inside once pinned (it's not receiving clicks!),
 * so the tray menu's "Toggle Pin Mode" item is the escape hatch — it's
 * listened for here via a Tauri event.
 */
export function useClickThrough() {
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const setPin = useCallback(async (next: boolean) => {
    setPinned(next);
    await setPinMode(next);
  }, []);

  const togglePin = useCallback(() => {
    void setPin(!pinnedRef.current);
  }, [setPin]);

  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    getCurrentWindow()
      .listen("tray://toggle-pin", () => {
        void setPin(!pinnedRef.current);
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => unlisten?.();
  }, [setPin]);

  return { pinned, togglePin, setPin };
}
