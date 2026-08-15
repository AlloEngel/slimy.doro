use std::fs;
use std::path::PathBuf;

use serde_json::Value;
use tauri::{AppHandle, Manager, Runtime};

/// Only allow writes to a fixed allow-list of filenames inside app data.
/// This keeps the command from being usable as an arbitrary file-write
/// primitive even though it's exposed to the webview.
const ALLOWED_FILES: [&str; 3] = ["config.json", "tasks.json", "theme.json"];

fn resolve_path<R: Runtime>(app: &AppHandle<R>, file_name: &str) -> Result<PathBuf, String> {
    if !ALLOWED_FILES.contains(&file_name) {
        return Err(format!("'{file_name}' is not a recognized app data file"));
    }
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(file_name))
}

/// Read `$APP_DATA/<file_name>` and parse it as JSON. Returns `null` when
/// the file does not exist yet (first run), rather than erroring.
#[tauri::command]
pub fn read_json_file<R: Runtime>(app: AppHandle<R>, file_name: String) -> Result<Value, String> {
    let path = resolve_path(&app, &file_name)?;
    if !path.exists() {
        return Ok(Value::Null);
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if raw.trim().is_empty() {
        return Ok(Value::Null);
    }
    serde_json::from_str(&raw).map_err(|e| format!("invalid JSON in {file_name}: {e}"))
}

/// Serialize `contents` (pretty-printed) and write it atomically to
/// `$APP_DATA/<file_name>` via a temp-file + rename, so a crash mid-write
/// never corrupts the user's saved tasks or settings.
#[tauri::command]
pub fn write_json_file<R: Runtime>(
    app: AppHandle<R>,
    file_name: String,
    contents: Value,
) -> Result<(), String> {
    let path = resolve_path(&app, &file_name)?;
    let tmp_path = path.with_extension("tmp");
    let serialized = serde_json::to_string_pretty(&contents).map_err(|e| e.to_string())?;
    fs::write(&tmp_path, serialized).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, &path).map_err(|e| e.to_string())?;
    Ok(())
}
