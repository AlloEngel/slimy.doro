// Added a second listener for the global-shortcut event. Unlike the
// tray toggle (which flips state), this one always forces `pinned`
// to false — it's the "get me unstuck" button, not a toggle.
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { setPinMode, setAlwaysOnTop, isTauri } from "@/lib/tauri";


export function useClickThrough(alwaysOnTop: boolean) {
  {
    const [pinned, setPinned] = useState(false);
    const pinnedRef = useRef(pinned);
    pinnedRef.current = pinned;

    const setPin = useCallback(async (next: boolean) => {
      setPinned(next);
      await setPinMode(next);
    }, []);

    const togglePin = useCallback(() => {
      void setPin(!pinnedRef.current);
    }, [setPin, alwaysOnTop]);

    useEffect(() => {
      if (!isTauri) return;
      const unlisteners: Array<() => void> = [];

      getCurrentWindow()
          .listen("shortcut://force-unpin", async () => {
            // The Rust shortcut handler already disables click-through
            // and temporarily disables Always on Top to recover the window.
            setPinned(false);

            // Restore the user's persisted Always on Top preference.
            await setAlwaysOnTop(alwaysOnTop);
          })
          .then((fn) => unlisteners.push(fn));

      return () => unlisteners.forEach((fn) => fn());
    }, [setPin, alwaysOnTop]);

    return {pinned, togglePin, setPin};
  }
}