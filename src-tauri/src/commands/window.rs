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

// Must match .app-scale { transform: scale(0.7) } in index.css.
const APP_SCALE: f64 = 0.7;

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

    // Use the monitor's work area instead of the full monitor.
    // This excludes the Windows taskbar and other reserved system areas.
    let work_area = monitor.work_area();

    let window_size: PhysicalSize<u32> =
        window.outer_size().map_err(|e| e.to_string())?;

    let margin = EDGE_MARGIN as f64;

    // The native window remains at its original size,
    // but the visible React content is scaled to 70%.
    let visual_width = window_size.width as f64 * APP_SCALE;
    let visual_height = window_size.height as f64 * APP_SCALE;

    let work_left = work_area.position.x as f64;
    let work_top = work_area.position.y as f64;

    let work_right =
        work_left + work_area.size.width as f64;

    let work_bottom =
        work_top + work_area.size.height as f64;

    let (x, y) = match position {
        SnapPosition::TopLeft => (
            work_left + margin,
            work_top + margin,
        ),

        SnapPosition::TopRight => (
            work_right - margin - visual_width,
            work_top + margin,
        ),

        SnapPosition::BottomLeft => (
            work_left + margin,
            work_bottom - margin - visual_height,
        ),

        SnapPosition::BottomRight => (
            work_right - margin - visual_width,
            work_bottom - margin - visual_height,
        ),

        SnapPosition::Center => (
            work_left
                + (work_area.size.width as f64 - visual_width) / 2.0,

            work_top
                + (work_area.size.height as f64 - visual_height) / 2.0,
        ),
    };

    window
        .set_position(PhysicalPosition::new(
            x.round() as i32,
            y.round() as i32,
        ))
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