use serde::{Deserialize, Serialize};
use tauri::{
    LogicalSize,
    Monitor,
    PhysicalPosition,
    Runtime,
    WebviewWindow,
};

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

/// Returns the monitor currently associated with the window.
///
/// If the current monitor cannot be determined, the primary monitor
/// is used as a fallback.
fn active_monitor<R: Runtime>(
    window: &WebviewWindow<R>,
) -> Result<Monitor, String> {
    window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "no monitor available for this window".to_string())
}

/// Enables or disables Pin Mode.
///
/// Pin Mode controls click-through behavior independently from
/// the user's Always on Top preference.
#[tauri::command]
pub fn set_pin_mode<R: Runtime>(
    window: WebviewWindow<R>,
    pinned: bool,
) -> Result<(), String> {
    window
        .set_ignore_cursor_events(pinned)
        .map_err(|e| e.to_string())
}

/// Controls the native Always on Top state.
///
/// Always on Top is independent from Pin Mode, so enabling or
/// disabling Pin Mode does not change this preference.
#[tauri::command]
pub fn set_always_on_top<R: Runtime>(
    window: WebviewWindow<R>,
    enabled: bool,
) -> Result<(), String> {
    window
        .set_always_on_top(enabled)
        .map_err(|e| e.to_string())
}

/// Enables or disables the native background window effect.
///
/// Windows:
/// - Uses the native Blur effect on Windows 10 and Windows 11.
/// - The effect is rendered by the native window system, allowing
///   content outside the WebView to be blurred.
///
/// macOS:
/// - Uses a native vibrancy material.
///
/// Linux:
/// - Tauri does not currently support native window effects.
/// - The window remains transparent without applying a native effect.
///
/// The window must be configured as transparent for native effects
/// to work correctly.
#[tauri::command]
pub fn set_background_effect<R: Runtime>(
    window: WebviewWindow<R>,
    enabled: bool,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectsBuilder};

        /*
         * Windows uses the native Blur effect.
         *
         * Unlike CSS backdrop-filter, this effect operates on the
         * native window and can therefore blur desktop content
         * behind the application.
         */
        if enabled {
            let effects = EffectsBuilder::new()
                .effect(Effect::Blur)
                .build();

            window
                .set_effects(effects)
                .map_err(|e| e.to_string())?;
        } else {
            /*
             * Removing the effect restores the normal transparent
             * window behavior.
             */
            window
                .set_effects(None)
                .map_err(|e| e.to_string())?;
        }

        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        use tauri::window::{
            Effect,
            EffectState,
            EffectsBuilder,
        };

        if enabled {
            /*
             * macOS uses native vibrancy materials instead of
             * the Windows Blur system.
             *
             * Popover provides a translucent system material
             * suitable for a compact floating application.
             */
            let effects = EffectsBuilder::new()
                .effect(Effect::Popover)
                .state(EffectState::Active)
                .build();

            window
                .set_effects(effects)
                .map_err(|e| e.to_string())?;
        } else {
            /*
             * Remove any active native effect when Background
             * blur is disabled.
             */
            window
                .set_effects(None)
                .map_err(|e| e.to_string())?;
        }

        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        /*
         * Native Tauri window effects are currently unsupported
         * on Linux.
         *
         * The application intentionally keeps running with its
         * normal transparent window behavior instead of failing
         * when the user enables Background blur.
         */
        let _ = window;
        let _ = enabled;

        return Ok(());
    }

    #[allow(unreachable_code)]
    Ok(())
}

/// Moves the window to one of the supported snap positions.
///
/// Window dimensions are read in physical pixels because the monitor
/// work area and native window position use physical coordinates.
///
/// Window resizing itself is still performed using logical dimensions.
#[tauri::command]
pub fn snap_window<R: Runtime>(
    window: WebviewWindow<R>,
    position: SnapPosition,
) -> Result<(), String> {
    let monitor = active_monitor(&window)?;
    let work_area = monitor.work_area();

    /*
     * The native window size depends on the current monitor DPI.
     * Position calculations, however, use physical coordinates.
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

/// Sets the native window width using logical pixels.
///
/// Logical sizing is required to keep the CSS/WebView viewport
/// consistent across monitors with different DPI scaling.
#[tauri::command]
pub fn set_window_width<R: Runtime>(
    window: WebviewWindow<R>,
    width: f64,
) -> Result<(), String> {
    let scale_factor = window
        .scale_factor()
        .map_err(|e| e.to_string())?;

    let physical_size = window
        .outer_size()
        .map_err(|e| e.to_string())?;

    let logical_size =
        physical_size.to_logical::<f64>(scale_factor);

    window
        .set_size(LogicalSize::new(
            width,
            logical_size.height,
        ))
        .map_err(|e| e.to_string())
}

/// Sets the native window height using logical pixels.
///
/// This prevents Windows DPI scaling from shrinking the native window
/// relative to the dimensions expected by the CSS layout.
#[tauri::command]
pub fn set_window_height<R: Runtime>(
    window: WebviewWindow<R>,
    height: f64,
) -> Result<(), String> {
    let scale_factor = window
        .scale_factor()
        .map_err(|e| e.to_string())?;

    let physical_size = window
        .outer_size()
        .map_err(|e| e.to_string())?;

    let logical_size =
        physical_size.to_logical::<f64>(scale_factor);

    window
        .set_size(LogicalSize::new(
            logical_size.width,
            height,
        ))
        .map_err(|e| e.to_string())
}

/// Starts the native window drag operation.
///
/// The application does not use a native titlebar, so non-interactive
/// parts of the UI can call this command to move the window.
#[tauri::command]
pub fn start_drag<R: Runtime>(
    window: WebviewWindow<R>,
) -> Result<(), String> {
    window
        .start_dragging()
        .map_err(|e| e.to_string())
}

/// Moves the window by the requested physical pixel offset.
///
/// This command is used for incremental native window movement.
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