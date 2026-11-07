use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolVersionInfo {
    pub version: String,
    #[serde(default)]
    pub requested_version: Option<String>,
    #[serde(default)]
    pub install_path: Option<String>,
    #[serde(default)]
    pub installed: bool,
    #[serde(default)]
    pub active: bool,
}

pub type InstalledToolsMap = HashMap<String, Vec<ToolVersionInfo>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryTool {
    pub name: String,
    pub full_name: String,
    #[serde(default)]
    pub backend: String,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryPreset {
    pub id: String,
    pub name: String,
    pub tool: String,             // "npm" | "pip" | "go" | "cargo"
    pub registry_url: String,     // e.g. "https://artifactory.mycorp.internal/artifactory/api/npm/virtual"
    pub token: Option<String>,
    pub ca_cert_path: Option<String>,
    pub active: bool,
    pub is_local_secret: bool,    // stored in .mise.local.toml
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub tool: String,
    pub registry_url: Option<String>,
    pub static_env_ok: bool,
    pub network_reachable: bool,
    pub tls_valid: bool,
    pub cli_ping_success: bool,
    pub exit_code: Option<i32>,
    pub status_message: String,
    pub suggested_fix: Option<String>,
    pub details: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathDiagnostic {
    pub path_entries: Vec<String>,
    pub conflicts: Vec<String>,
    pub mise_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDriftTool {
    pub name: String,
    pub requested_version: String,
    pub installed_version: Option<String>,
    pub is_satisfied: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSyncStatus {
    pub workspace_path: String,
    pub config_file_found: bool,
    pub config_file_path: Option<String>,
    pub is_in_sync: bool,
    pub missing_tools: Vec<ProjectDriftTool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigFileInfo {
    pub file_type: String,       // "global" | "project" | "local_secret"
    pub path: String,
    pub exists: bool,
    pub content: String,
}
