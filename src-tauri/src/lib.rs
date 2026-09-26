mod commands;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager};

use tauri_plugin_global_shortcut::{
    Code,
    Modifiers,
    Shortcut,
    ShortcutState,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Creates the base Tauri application builder.
    let mut builder = tauri::Builder::default();

    /*
     * Single-instance plugin.
     *
     * If the application is launched while another instance is already
     * running, the existing main window is shown and focused instead.
     */
    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_single_instance::init(|app, _args, _cwd| {
                if let Some(window) =
                    app.get_webview_window("main")
                {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }),
        );
    }

    /*
     * Window state persistence.
     *
     * IMPORTANT:
     * Only the window position is persisted.
     *
     * The application itself controls its native width and height from
     * App.tsx because the height changes depending on whether the
     * to-do list is visible.
     *
     * This prevents an old physical window size from being restored
     * after switching monitors or DPI scales.
     */
    #[cfg(desktop)]
    {
        builder = builder.plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::POSITION,
                )
                .build(),
        );
    }

    /*
     * Emergency unpin shortcut.
     *
     * Windows/Linux:
     * Ctrl + Shift + U
     *
     * macOS:
     * Cmd + Shift + U
     *
     * This is necessary because a pinned window ignores mouse events,
     * making normal HTML controls inaccessible.
     */
    #[cfg(desktop)]
    {
        #[cfg(target_os = "macos")]
        let modifiers =
            Modifiers::SUPER | Modifiers::SHIFT;

        #[cfg(not(target_os = "macos"))]
        let modifiers =
            Modifiers::CONTROL | Modifiers::SHIFT;

        let unpin_shortcut = Shortcut::new(
            Some(modifiers),
            Code::KeyU,
        );

        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut(unpin_shortcut)
                .expect(
                    "failed to register emergency-unpin shortcut",
                )
                .with_handler(
                    move |app, scut, event| {
                        if scut == &unpin_shortcut
                            && event.state()
                                == ShortcutState::Pressed
                        {
                            if let Some(window) =
                                app.get_webview_window("main")
                            {
                                /*
                                 * Restore mouse interaction first.
                                 *
                                 * This allows the user to interact with
                                 * the window again after emergency unpin.
                                 */
                                let _ = window
                                    .set_ignore_cursor_events(false);

                                /*
                                 * Temporarily disable Always on Top.
                                 *
                                 * React restores the user's persisted
                                 * Always on Top preference after receiving
                                 * the shortcut event.
                                 */
                                let _ =
                                    window.set_always_on_top(false);

                                /*
                                 * Notify the React application that the
                                 * emergency unpin was triggered.
                                 */
                                let _ = window.emit(
                                    "shortcut://force-unpin",
                                    (),
                                );
                            }
                        }
                    },
                )
                .build(),
        );
    }

    /*
     * Register application plugins.
     *
     * These provide filesystem access, notifications, positioning,
     * and other native functionality used by the application.
     */
    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_positioner::init())

        /*
         * Application setup.
         */
        .setup(|app| {
            /*
             * Do not force a startup position here.
             *
             * tauri-plugin-window-state restores the last saved position.
             * Forcing a position such as BottomRight here would overwrite
             * that restored position every time the application launches.
             */

            // --- Window icon ---

            /*
             * Use the original high-resolution Tauri icon for the native
             * application window and Windows taskbar.
             */
            if let Some(window) =
                app.get_webview_window("main")
            {
                let icon_bytes =
                    include_bytes!("../icons/128x128.png");

                let icon =
                    tauri::image::Image::from_bytes(icon_bytes)
                        .map_err(|e| e.to_string())?;

                window
                    .set_icon(icon)
                    .map_err(|e| e.to_string())?;
            }

            // --- System tray ---

            /*
             * Creates the Show / Hide tray action.
             */
            let show_hide = MenuItem::with_id(
                app,
                "toggle-visibility",
                "Show / Hide",
                true,
                None::<&str>,
            )?;

            /*
             * Creates the tray action for toggling Pin Mode.
             */
            let pin = MenuItem::with_id(
                app,
                "toggle-pin",
                "Toggle Pin Mode",
                true,
                None::<&str>,
            )?;

            /*
             * Creates the native application quit action.
             */
            let quit =
                PredefinedMenuItem::quit(
                    app,
                    Some("Quit Pixel Slime Pomodoro"),
                )?;

            /*
             * Builds the tray menu from the actions above.
             */
            let tray_menu = Menu::with_items(
                app,
                &[&show_hide, &pin, &quit],
            )?;

            /*
             * Creates the system tray icon and handles its menu events.
             */
            TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .icon(
                    app.default_window_icon()
                        .unwrap()
                        .clone(),
                )
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        /*
                         * Show or hide the main application window.
                         */
                        "toggle-visibility" => {
                            if let Some(window) =
                                app.get_webview_window("main")
                            {
                                let visible =
                                    window
                                        .is_visible()
                                        .unwrap_or(true);

                                if visible {
                                    let _ =
                                        window.hide();
                                } else {
                                    let _ =
                                        window.show();

                                    let _ =
                                        window.set_focus();
                                }
                            }
                        }

                        /*
                         * Sends the tray pin action to React.
                         *
                         * React owns the Pin state so the same logic is
                         * used whether the user clicks the window button
                         * or the tray menu.
                         */
                        "toggle-pin" => {
                            if let Some(window) =
                                app.get_webview_window("main")
                            {
                                let _ = window.emit(
                                    "tray://toggle-pin",
                                    (),
                                );
                            }
                        }

                        /*
                         * Ignore unknown tray events.
                         */
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })

        /*
         * Registers all commands exposed to the frontend.
         */
        .invoke_handler(
            tauri::generate_handler![
                commands::window::set_pin_mode,
                commands::window::set_always_on_top,
                commands::window::snap_window,
                commands::window::set_window_width,
                commands::window::set_window_height,
                commands::window::start_drag,
                commands::window::move_window_by,
                commands::storage::read_json_file,
                commands::storage::write_json_file,
            ],
        )

        /*
         * Starts the native Tauri application.
         */
        .run(tauri::generate_context!())
        .expect(
            "error while running Pixel Slime Pomodoro",
        );
}