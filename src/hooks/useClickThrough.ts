// Added a second listener for the global-shortcut event. Unlike the
// tray toggle (which flips state), this one always forces `pinned`
// to false — it's the "get me unstuck" button, not a toggle.
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { setPinMode, isTauri } from "@/lib/tauri";

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
    const unlisteners: Array<() => void> = [];

    getCurrentWindow()
        .listen("tray://toggle-pin", () => {
          void setPin(!pinnedRef.current);
        })
        .then((fn) => unlisteners.push(fn));

    // Emergency unpin (global shortcut) — always forces unpinned,
    // regardless of current state, and syncs the React side after
    // the Rust side has already cleared click-through/always-on-top.
    getCurrentWindow()
        .listen("shortcut://force-unpin", () => {
          setPinned(false);
        })
        .then((fn) => unlisteners.push(fn));

    return () => unlisteners.forEach((fn) => fn());
  }, [setPin]);

  return { pinned, togglePin, setPin };
}