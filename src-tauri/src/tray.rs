use tauri::{
    AppHandle, Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_hide = MenuItem::with_id(app, "toggle", "Show/Hide Window", true, None::<&str>)?;
    let status = MenuItem::with_id(
        app,
        "status",
        "Mise Status: 🟢 All Tools In Sync",
        false,
        None::<&str>,
    )?;
    let sep = MenuItem::with_id(app, "sep", "---", false, None::<&str>)?;
    let preset_artifactory = MenuItem::with_id(
        app,
        "preset_artifactory",
        "Switch to Corporate Artifactory",
        true,
        None::<&str>,
    )?;
    let preset_public = MenuItem::with_id(
        app,
        "preset_public",
        "Switch to Public NPM",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "Quit Mise Desktop", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &status,
            &sep,
            &preset_artifactory,
            &preset_public,
            &show_hide,
            &quit,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = if window.is_visible().unwrap_or(false) {
                        window.hide()
                    } else {
                        window.show().and_then(|_| window.set_focus())
                    };
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show().and_then(|_| window.set_focus());
                }
            }
        })
        .build(app)?;

    Ok(())
}
