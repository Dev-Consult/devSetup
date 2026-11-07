use crate::models::{InstalledToolsMap, PathDiagnostic, RegistryTool};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

pub struct MiseCli;

impl MiseCli {
    pub fn find_binary() -> Result<PathBuf, String> {
        // 1. Check PATH
        if let Ok(output) = Command::new("which").arg("mise").output() {
            let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if output.status.success() && !path_str.is_empty() {
                return Ok(PathBuf::from(path_str));
            }
        }

        // 2. Check canonical home paths
        if let Ok(home) = std::env::var("HOME") {
            let candidates = [
                format!("{}/.local/bin/mise", home),
                format!("{}/.cargo/bin/mise", home),
                "/usr/local/bin/mise".to_string(),
                "/usr/bin/mise".to_string(),
            ];
            for candidate in &candidates {
                let p = Path::new(candidate);
                if p.is_file() {
                    return Ok(p.to_path_buf());
                }
            }
        }

        Err("Could not find `mise` binary on PATH or standard directories.".to_string())
    }

    pub fn list_installed(workspace: Option<&str>) -> Result<InstalledToolsMap, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        if let Some(dir) = workspace {
            cmd.arg("-C").arg(dir);
        }
        cmd.arg("ls").arg("--json");

        let output = cmd.output().map_err(|e| format!("Failed to execute mise ls: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str::<InstalledToolsMap>(&stdout)
            .map_err(|e| format!("Failed to parse mise ls JSON: {}", e))
    }

    pub fn get_env(workspace: Option<&str>) -> Result<HashMap<String, String>, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        if let Some(dir) = workspace {
            cmd.arg("-C").arg(dir);
        }
        cmd.arg("env").arg("--json");

        let output = cmd.output().map_err(|e| format!("Failed to execute mise env: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str::<HashMap<String, String>>(&stdout)
            .map_err(|e| format!("Failed to parse mise env JSON: {}", e))
    }

    pub fn get_registry() -> Result<Vec<RegistryTool>, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        cmd.arg("registry");

        let output = cmd.output().map_err(|e| format!("Failed to run mise registry: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut list = Vec::new();
        for line in stdout.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let name = parts[0].to_string();
                let full = parts[1].to_string();
                let backend = full.split(':').next().unwrap_or("core").to_string();
                list.push(RegistryTool {
                    name,
                    full_name: full,
                    backend,
                    description: None,
                });
            }
        }
        Ok(list)
    }

    pub fn run_doctor(workspace: Option<&str>) -> Result<String, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        if let Some(dir) = workspace {
            cmd.arg("-C").arg(dir);
        }
        cmd.arg("doctor");

        let output = cmd.output().map_err(|e| format!("Failed to run mise doctor: {}", e))?;
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    pub fn diagnose_path(workspace: Option<&str>) -> Result<PathDiagnostic, String> {
        let env_map = Self::get_env(workspace)?;
        let path_var = env_map.get("PATH").cloned().unwrap_or_default();
        let entries: Vec<String> = path_var
            .split(':')
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .collect();

        let mut conflicts = Vec::new();
        let mise_active = entries.iter().any(|e| e.contains(".local/share/mise"));

        // Detect if system binary precedes mise
        let mut seen_sys_node = false;
        for entry in &entries {
            if entry.contains("/usr/bin") || entry.contains("/usr/local/bin") {
                seen_sys_node = true;
            }
            if entry.contains("installs/node") && seen_sys_node {
                conflicts.push("System PATH (/usr/bin) precedes Mise Node install, which can shadow runtime versions.".to_string());
            }
        }

        Ok(PathDiagnostic {
            path_entries: entries,
            conflicts,
            mise_active,
        })
    }

    pub fn exec_command(
        workspace: Option<&str>,
        cmd_name: &str,
        args: &[&str],
    ) -> Result<(bool, i32, String, String), String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        if let Some(dir) = workspace {
            cmd.arg("-C").arg(dir);
        }
        cmd.arg("exec").arg("--").arg(cmd_name);
        for arg in args {
            cmd.arg(arg);
        }

        let output = cmd.output().map_err(|e| format!("Failed to exec {}: {}", cmd_name, e))?;
        let code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        Ok((output.status.success(), code, stdout, stderr))
    }

    pub fn list_remote_versions(tool: &str) -> Result<Vec<String>, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        cmd.arg("ls-remote").arg(tool);

        let output = cmd.output().map_err(|e| format!("Failed to run mise ls-remote: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut versions: Vec<String> = stdout
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        versions.reverse();
        Ok(versions.into_iter().take(30).collect())
    }

    pub fn check_drift(workspace: Option<&str>) -> Result<crate::models::ProjectSyncStatus, String> {
        let dir = workspace.unwrap_or(".");
        let ws_path = PathBuf::from(dir)
            .canonicalize()
            .unwrap_or_else(|_| PathBuf::from(dir))
            .to_string_lossy()
            .to_string();

        let candidates = [
            format!("{}/mise.toml", dir),
            format!("{}/.mise.toml", dir),
            format!("{}/.tool-versions", dir),
        ];

        let config_file = candidates.iter().find(|p| Path::new(p).exists()).cloned();
        let config_found = config_file.is_some();

        let installed_map = Self::list_installed(Some(dir)).unwrap_or_default();
        let mut missing_tools = Vec::new();

        for (name, versions) in installed_map {
            for v in versions {
                let requested = v.requested_version.unwrap_or_else(|| "latest".to_string());
                let satisfied = v.installed && v.active;
                if !satisfied {
                    missing_tools.push(crate::models::ProjectDriftTool {
                        name: name.clone(),
                        requested_version: requested,
                        installed_version: if v.installed { Some(v.version) } else { None },
                        is_satisfied: false,
                    });
                }
            }
        }

        let is_in_sync = missing_tools.is_empty();

        Ok(crate::models::ProjectSyncStatus {
            workspace_path: ws_path,
            config_file_found: config_found,
            config_file_path: config_file,
            is_in_sync,
            missing_tools,
        })
    }

    pub fn sync_workspace(workspace: Option<&str>) -> Result<String, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        if let Some(dir) = workspace {
            cmd.arg("-C").arg(dir);
        }
        cmd.arg("install");

        let output = cmd.output().map_err(|e| format!("Failed to run mise install: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        Ok("All workspace tools have been successfully synchronized!".to_string())
    }

    pub fn get_config_files(workspace: Option<&str>) -> Result<Vec<crate::models::ConfigFileInfo>, String> {
        let mut list = Vec::new();

        // 1. Global config
        if let Ok(home) = std::env::var("HOME") {
            let global_path = format!("{}/.config/mise/config.toml", home);
            let exists = Path::new(&global_path).exists();
            let content = if exists {
                std::fs::read_to_string(&global_path).unwrap_or_default()
            } else {
                "# Mise Global Configuration\n[tools]\n\n[env]\n".to_string()
            };
            list.push(crate::models::ConfigFileInfo {
                file_type: "global".to_string(),
                path: global_path,
                exists,
                content,
            });
        }

        // 2. Project config
        let ws_dir = workspace.unwrap_or(".");
        let project_path = format!("{}/.mise.toml", ws_dir);
        let exists_proj = Path::new(&project_path).exists();
        let content_proj = if exists_proj {
            std::fs::read_to_string(&project_path).unwrap_or_default()
        } else {
            "# Project Configuration\n[tools]\n\n[env]\n".to_string()
        };
        list.push(crate::models::ConfigFileInfo {
            file_type: "project".to_string(),
            path: project_path,
            exists: exists_proj,
            content: content_proj,
        });

        // 3. Local secret config
        let local_path = format!("{}/.mise.local.toml", ws_dir);
        let exists_local = Path::new(&local_path).exists();
        let content_local = if exists_local {
            std::fs::read_to_string(&local_path).unwrap_or_default()
        } else {
            "# Local Secrets & Overrides (Git Ignored)\n[env]\n".to_string()
        };
        list.push(crate::models::ConfigFileInfo {
            file_type: "local_secret".to_string(),
            path: local_path,
            exists: exists_local,
            content: content_local,
        });

        Ok(list)
    }

    pub fn save_config(file_path: &str, content: &str) -> Result<String, String> {
        let path = Path::new(file_path);
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        std::fs::write(path, content)
            .map_err(|e| format!("Failed to write to {}: {}", file_path, e))?;
        Ok(format!("Configuration successfully saved to {}", file_path))
    }

    pub fn uninstall_tool(tool: &str, version: &str) -> Result<String, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        cmd.arg("uninstall").arg(format!("{}@{}", tool, version));

        let output = cmd.output().map_err(|e| format!("Failed to run mise uninstall: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(format!("Successfully uninstalled {}@{}", tool, version))
    }

    pub fn prune_tools() -> Result<String, String> {
        let binary = Self::find_binary()?;
        let mut cmd = Command::new(binary);
        cmd.arg("prune").arg("-y");

        let output = cmd.output().map_err(|e| format!("Failed to run mise prune: {}", e))?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(if stdout.trim().is_empty() {
            "No unreferenced tool versions to prune. Everything is clean!".to_string()
        } else {
            stdout.to_string()
        })
    }

    pub fn audit_env_template(workspace: Option<&str>) -> Result<crate::models::EnvAuditReport, String> {
        let dir = workspace.unwrap_or(".");
        let candidates = [
            format!("{}/.env.example", dir),
            format!("{}/.env.template", dir),
            format!("{}/env.example", dir),
        ];

        let example_file = candidates.iter().find(|p| Path::new(p).exists()).cloned();
        let env_map = Self::get_env(workspace).unwrap_or_default();

        let mut items = Vec::new();
        let mut missing_count = 0;

        if let Some(ref path) = example_file {
            if let Ok(content) = std::fs::read_to_string(path) {
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.is_empty() || trimmed.starts_with('#') {
                        continue;
                    }
                    if let Some((k, v)) = trimmed.split_once('=') {
                        let key = k.trim().to_string();
                        let def_val = v.trim().trim_matches('"').trim_matches('\'').to_string();

                        let is_set = env_map.contains_key(&key);
                        let val = env_map.get(&key).map(|s| s.as_str()).unwrap_or("");
                        let is_empty = val.trim().is_empty();

                        if !is_set || is_empty {
                            missing_count += 1;
                        }

                        items.push(crate::models::EnvAuditItem {
                            key,
                            is_set,
                            is_empty,
                            default_value: if def_val.is_empty() { None } else { Some(def_val) },
                        });
                    }
                }
            }
        }

        Ok(crate::models::EnvAuditReport {
            example_file_found: example_file.is_some(),
            example_file_path: example_file,
            items,
            missing_count,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_binary() {
        let bin = MiseCli::find_binary();
        assert!(bin.is_ok(), "Mise binary should be discoverable: {:?}", bin);
    }

    #[test]
    fn test_list_installed() {
        let tools = MiseCli::list_installed(None);
        assert!(tools.is_ok(), "Listing installed tools should succeed: {:?}", tools);
    }
}
