import { useEffect, useRef } from "react";
import { moveWindowBy, setWindowWidth } from "@/lib/tauri";
import { BASE_WINDOW_WIDTH, DRAWER_EXTRA_WIDTH, EXPANDED_WINDOW_WIDTH } from "@/lib/layout";

export function useDrawerWindowSync(expanded: boolean) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const sync = async () => {
      if (expanded) {
        await setWindowWidth(EXPANDED_WINDOW_WIDTH);
        await moveWindowBy(-DRAWER_EXTRA_WIDTH, 0);
      } else {
        await moveWindowBy(DRAWER_EXTRA_WIDTH, 0);
        await setWindowWidth(BASE_WINDOW_WIDTH);
      }
    };
    void sync();
  }, [expanded]);
}
