use serde::{Deserialize, Serialize};
use tauri::{Monitor, PhysicalPosition, PhysicalSize, Runtime, WebviewWindow};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum SnapPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Center,
}

const EDGE_MARGIN: i32 = 48;

fn active_monitor<R: Runtime>(
    window: &WebviewWindow<R>,
) -> Result<Monitor, String> {
    window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "no monitor available for this window".to_string())
}

#[tauri::command]
pub fn set_pin_mode<R: Runtime>(
    window: WebviewWindow<R>,
    pinned: bool,
) -> Result<(), String> {
    window
        .set_ignore_cursor_events(pinned)
        .map_err(|e| e.to_string())?;

    window
        .set_always_on_top(pinned)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_always_on_top<R: Runtime>(
    window: WebviewWindow<R>,
    enabled: bool,
) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn snap_window<R: Runtime>(
    window: WebviewWindow<R>,
    position: SnapPosition,
) -> Result<(), String> {
    let monitor = active_monitor(&window)?;
    let work_area = monitor.work_area();

    /*
     * The native window is now the same size as the visible application.
     * There is no CSS transform to compensate for here.
     */
    let window_size = window
        .outer_size()
        .map_err(|e| e.to_string())?;

    let margin = EDGE_MARGIN;

    let work_left = work_area.position.x;
    let work_top = work_area.position.y;

    let work_right =
        work_left + work_area.size.width as i32;

    let work_bottom =
        work_top + work_area.size.height as i32;

    let window_width = window_size.width as i32;
    let window_height = window_size.height as i32;

    let (x, y) = match position {
        SnapPosition::TopLeft => (
            work_left + margin,
            work_top + margin,
        ),

        SnapPosition::TopRight => (
            work_right - margin - window_width,
            work_top + margin,
        ),

        SnapPosition::BottomLeft => (
            work_left + margin,
            work_bottom - margin - window_height,
        ),

        SnapPosition::BottomRight => (
            work_right - margin - window_width,
            work_bottom - margin - window_height,
        ),

        SnapPosition::Center => (
            work_left
                + (work_area.size.width as i32 - window_width) / 2,

            work_top
                + (work_area.size.height as i32 - window_height) / 2,
        ),
    };

    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

// Kept for compatibility with the existing frontend/command registration.
#[tauri::command]
pub fn set_window_width<R: Runtime>(
    window: WebviewWindow<R>,
    width: f64,
) -> Result<(), String> {
    let size = window
        .outer_size()
        .map_err(|e| e.to_string())?;

    window
        .set_size(PhysicalSize::new(width as u32, size.height))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_window_height<R: Runtime>(
    window: WebviewWindow<R>,
    height: f64,
) -> Result<(), String> {
    let size = window
        .outer_size()
        .map_err(|e| e.to_string())?;

    window
        .set_size(PhysicalSize::new(size.width, height as u32))
        .map_err(|e| e.to_string())
}

// Kept for compatibility with the existing frontend/command registration.
#[tauri::command]
pub fn start_drag<R: Runtime>(
    window: WebviewWindow<R>,
) -> Result<(), String> {
    window
        .start_dragging()
        .map_err(|e| e.to_string())
}

// Kept for compatibility with the existing frontend/command registration.
#[tauri::command]
pub fn move_window_by<R: Runtime>(
    window: WebviewWindow<R>,
    dx: f64,
    dy: f64,
) -> Result<(), String> {
    let position = window
        .outer_position()
        .map_err(|e| e.to_string())?;

    window
        .set_position(PhysicalPosition::new(
            position.x + dx as i32,
            position.y + dy as i32,
        ))
        .map_err(|e| e.to_string())
}