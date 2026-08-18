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

   // Emergency unpin: fires even while the window is click-through,
       // because global shortcuts are captured at the OS level, not
       // routed through the (currently ignoring) webview.
       #[cfg(desktop)]
       {
           builder = builder.plugin(
               tauri_plugin_global_shortcut::Builder::new()
                   .with_handler(|app, _shortcut, event| {
                       if event.state() == ShortcutState::Pressed {
                           if let Some(window) = app.get_webview_window("main") {
                               let _ = window.set_ignore_cursor_events(false);
                               let _ = window.set_always_on_top(false);
                               // Tell the frontend so its `pinned` state stays in sync.
                               let _ = window.emit("shortcut://force-unpin", ());
                           }
                       }
                   })
                   .build(),
           );
       }

       builder
           .plugin(tauri_plugin_fs::init())
           .plugin(tauri_plugin_notification::init())
           .plugin(tauri_plugin_positioner::init())
           .setup(|app| {
               // --- Startup position: dock bottom-right on the primary monitor ---
               if let Some(window) = app.get_webview_window("main") {
                   let _ = commands::window::snap_window(
                       window,
                       commands::window::SnapPosition::BottomRight,
                   );
               }

               // --- Register the emergency-unpin shortcut ---
               #[cfg(desktop)]
               {
                   #[cfg(target_os = "macos")]
                   let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
                   #[cfg(not(target_os = "macos"))]
                   let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;

                   let shortcut = Shortcut::new(Some(modifiers), Code::KeyU);
                   app.global_shortcut().register(shortcut)?;
               }

               // --- System tray ---
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