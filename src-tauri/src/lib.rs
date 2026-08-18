mod commands;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager}; // <-- add Emitter here

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Only one instance of a desktop overlay should ever run at once —
    // a second launch just focuses/shows the existing window instead.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::POSITION
                        | tauri_plugin_window_state::StateFlags::SIZE,
                )
                .build(),
        );
    }

    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            // --- System tray -------------------------------------------------
            // Gives the user a way to bring back a pinned/click-through
            // window, or quit, without needing the (absent) titlebar.
            let show_hide = MenuItem::with_id(app, "toggle-visibility", "Show / Hide", true, None::<&str>)?;
            let pin = MenuItem::with_id(app, "toggle-pin", "Toggle Pin Mode", true, None::<&str>)?;
            let quit = PredefinedMenuItem::quit(app, Some("Quit Pixel Slime Pomodoro"))?;
            let tray_menu = Menu::with_items(app, &[&show_hide, &pin, &quit])?;

            TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle-visibility" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let visible = window.is_visible().unwrap_or(true);
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "toggle-pin" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("tray://toggle-pin", ());
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::window::set_pin_mode,
            commands::window::set_always_on_top,
            commands::window::snap_window,
            commands::window::set_window_width,
            commands::window::start_drag,
            commands::window::move_window_by,
            commands::storage::read_json_file,
            commands::storage::write_json_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pixel Slime Pomodoro");
}
