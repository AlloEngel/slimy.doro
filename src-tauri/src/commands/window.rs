use serde::{Deserialize, Serialize};
use tauri::{LogicalPosition, Monitor, PhysicalPosition, PhysicalSize, Runtime, WebviewWindow};

/// Preset snap targets for the overlay window, matching the corner/center
/// picker exposed in the settings panel.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SnapPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Center,
}

const EDGE_MARGIN: i32 = 24;

fn active_monitor<R: Runtime>(window: &WebviewWindow<R>) -> Result<Monitor, String> {
    window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "no monitor available for this window".to_string())
}

/// Toggle "pin mode": when pinned, the window ignores all mouse/click
/// events so the user can interact with whatever is behind it, and the
/// window is forced always-on-top so it stays visible while pinned.
#[tauri::command]
pub fn set_pin_mode<R: Runtime>(window: WebviewWindow<R>, pinned: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(pinned)
        .map_err(|e| e.to_string())?;
    window
        .set_always_on_top(pinned)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Independent always-on-top toggle, usable even while unpinned.
#[tauri::command]
pub fn set_always_on_top<R: Runtime>(window: WebviewWindow<R>, enabled: bool) -> Result<(), String> {
    window.set_always_on_top(enabled).map_err(|e| e.to_string())
}

/// Snap the overlay to a screen corner or center it, respecting the
/// monitor's scale factor and a small edge margin so the widget never
/// touches the very edge of the display.
#[tauri::command]
pub fn snap_window<R: Runtime>(window: WebviewWindow<R>, position: SnapPosition) -> Result<(), String> {
    let monitor = active_monitor(&window)?;
    let scale = monitor.scale_factor();
    let screen: PhysicalSize<u32> = *monitor.size();
    let win_size: PhysicalSize<u32> = window.outer_size().map_err(|e| e.to_string())?;
    let margin = (EDGE_MARGIN as f64 * scale) as i32;

    let (x, y) = match position {
        SnapPosition::TopLeft => (margin, margin),
        SnapPosition::TopRight => (
            screen.width as i32 - win_size.width as i32 - margin,
            margin,
        ),
        SnapPosition::BottomLeft => (
            margin,
            screen.height as i32 - win_size.height as i32 - margin,
        ),
        SnapPosition::BottomRight => (
            screen.width as i32 - win_size.width as i32 - margin,
            screen.height as i32 - win_size.height as i32 - margin,
        ),
        SnapPosition::Center => (
            (screen.width as i32 - win_size.width as i32) / 2,
            (screen.height as i32 - win_size.height as i32) / 2,
        ),
    };

    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

/// Grow/shrink the window's width in place (used when the to-do drawer
/// slides open) without moving its top-left anchor corner.
#[tauri::command]
pub fn set_window_width<R: Runtime>(window: WebviewWindow<R>, width: f64) -> Result<(), String> {
    let current = window.outer_size().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    window
        .set_size(tauri::Size::Physical(PhysicalSize::new(
            (width * scale) as u32,
            current.height,
        )))
        .map_err(|e| e.to_string())
}

/// Begin an OS-level window drag from the frontend (used by the
/// draggable surface since there is no native titlebar).
#[tauri::command]
pub fn start_drag<R: Runtime>(window: WebviewWindow<R>) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_window_by<R: Runtime>(window: WebviewWindow<R>, dx: f64, dy: f64) -> Result<(), String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let new_pos = LogicalPosition::new(
        pos.x as f64 / scale + dx,
        pos.y as f64 / scale + dy,
    );
    window
        .set_position(tauri::Position::Logical(new_pos))
        .map_err(|e| e.to_string())
}
