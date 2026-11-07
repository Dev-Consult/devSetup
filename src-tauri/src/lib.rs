pub mod diagnostics;
pub mod mise_cli;
pub mod models;
pub mod presets;
pub mod tray;

use diagnostics::DiagnosticsEngine;
use mise_cli::MiseCli;
use models::{DiagnosticReport, InstalledToolsMap, PathDiagnostic, RegistryPreset, RegistryTool};
use presets::PresetsManager;
use std::collections::HashMap;
use std::process::Command;

#[tauri::command]
fn get_installed_tools(workspace: Option<String>) -> Result<InstalledToolsMap, String> {
    MiseCli::list_installed(workspace.as_deref())
}

#[tauri::command]
fn get_active_env(workspace: Option<String>) -> Result<HashMap<String, String>, String> {
    MiseCli::get_env(workspace.as_deref())
}

#[tauri::command]
fn get_registry() -> Result<Vec<RegistryTool>, String> {
    MiseCli::get_registry()
}

#[tauri::command]
fn get_doctor(workspace: Option<String>) -> Result<String, String> {
    MiseCli::run_doctor(workspace.as_deref())
}

#[tauri::command]
fn get_path_diagnostics(workspace: Option<String>) -> Result<PathDiagnostic, String> {
    MiseCli::diagnose_path(workspace.as_deref())
}

#[tauri::command]
fn diagnose_tool(tool: String, workspace: Option<String>) -> DiagnosticReport {
    DiagnosticsEngine::diagnose_tool(&tool, workspace.as_deref())
}

#[tauri::command]
fn get_presets() -> Vec<RegistryPreset> {
    PresetsManager::get_default_presets()
}

#[tauri::command]
fn apply_preset(
    preset: RegistryPreset,
    workspace: Option<String>,
    token: Option<String>,
) -> Result<String, String> {
    PresetsManager::apply_preset(&preset, workspace.as_deref(), token.as_deref())
}

#[tauri::command]
fn get_remote_versions(tool: String) -> Result<Vec<String>, String> {
    MiseCli::list_remote_versions(&tool)
}

#[tauri::command]
fn check_project_drift(workspace: Option<String>) -> Result<models::ProjectSyncStatus, String> {
    MiseCli::check_drift(workspace.as_deref())
}

#[tauri::command]
fn sync_workspace(workspace: Option<String>) -> Result<String, String> {
    MiseCli::sync_workspace(workspace.as_deref())
}

#[tauri::command]
fn get_config_files(workspace: Option<String>) -> Result<Vec<models::ConfigFileInfo>, String> {
    MiseCli::get_config_files(workspace.as_deref())
}

#[tauri::command]
fn save_config(file_path: String, content: String) -> Result<String, String> {
    MiseCli::save_config(&file_path, &content)
}

#[tauri::command]
fn install_tool(tool: String, version: String, workspace: Option<String>) -> Result<String, String> {
    let binary = MiseCli::find_binary()?;
    let mut cmd = Command::new(binary);
    if let Some(ref dir) = workspace {
        cmd.arg("-C").arg(dir);
    }
    cmd.arg("use");
    if workspace.is_none() {
        cmd.arg("-g");
    }
    cmd.arg(format!("{}@{}", tool, version));

    let output = cmd.output().map_err(|e| format!("Failed to install tool: {}", e))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(format!("Successfully installed and configured {}@{}", tool, version))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                let _ = tray::create_tray(app.handle());
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_installed_tools,
            get_active_env,
            get_registry,
            get_doctor,
            get_path_diagnostics,
            diagnose_tool,
            get_presets,
            apply_preset,
            get_remote_versions,
            check_project_drift,
            sync_workspace,
            get_config_files,
            save_config,
            install_tool
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
