import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { SnapPosition } from "@/types";

/** True when running inside the Tauri shell (vs. `vite dev` in a plain browser tab). */
export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const SNAP_MAP: Record<SnapPosition, string> = {
  "top-left": "top-left",
  "top-right": "top-right",
  "bottom-left": "bottom-left",
  "bottom-right": "bottom-right",
  center: "center",
};

/** Toggle click-through "pin" mode + forced always-on-top. */
export async function setPinMode(pinned: boolean): Promise<void> {
  if (!isTauri) return;
  await invoke("set_pin_mode", { pinned });
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  if (!isTauri) return;
  await invoke("set_always_on_top", { enabled });
}

export async function snapWindow(position: SnapPosition): Promise<void> {
  if (!isTauri) return;
  await invoke("snap_window", { position: SNAP_MAP[position] });
}

export async function setWindowWidth(width: number): Promise<void> {
  if (!isTauri) return;
  await invoke("set_window_width", { width });
}

/** Nudge the window position by a logical-pixel delta (used to keep the
 * to-do drawer's expansion visually anchored to the right edge). */
export async function moveWindowBy(dx: number, dy: number): Promise<void> {
  if (!isTauri) return;
  await invoke("move_window_by", { dx, dy });
}

export async function startWindowDrag(): Promise<void> {
  if (!isTauri) return;
  await invoke("start_drag");
}

export async function closeApp(): Promise<void> {
  if (!isTauri) return;
  await getCurrentWindow().close();
}

export async function minimizeApp(): Promise<void> {
  if (!isTauri) return;
  await getCurrentWindow().minimize();
}

/** Read a JSON blob from `$APP_DATA/<fileName>` (config.json / tasks.json / theme.json). */
export async function readJsonFile<T>(fileName: string): Promise<T | null> {
  if (!isTauri) {
    const raw = window.localStorage.getItem(`dev:${fileName}`);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const value = await invoke<T | null>("read_json_file", { fileName });
  return value ?? null;
}

/** Atomically persist a JSON blob to `$APP_DATA/<fileName>`. */
export async function writeJsonFile<T>(fileName: string, contents: T): Promise<void> {
  if (!isTauri) {
    window.localStorage.setItem(`dev:${fileName}`, JSON.stringify(contents));
    return;
  }
  await invoke("write_json_file", { fileName, contents });
}

/** Ask (once) for OS notification permission, then fire a native toast. */
export async function notify(title: string, body: string): Promise<void> {
  if (!isTauri) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === "granted";
  }
  if (granted) {
    sendNotification({ title, body });
  }
}
