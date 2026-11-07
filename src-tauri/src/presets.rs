use crate::models::RegistryPreset;
use std::fs;
use std::path::Path;

pub struct PresetsManager;

impl PresetsManager {
    pub fn get_default_presets() -> Vec<RegistryPreset> {
        vec![
            RegistryPreset {
                id: "artifactory-npm".to_string(),
                name: "JFrog Artifactory (NPM)".to_string(),
                tool: "npm".to_string(),
                registry_url:
                    "https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/"
                        .to_string(),
                token: None,
                ca_cert_path: Some("/etc/ssl/certs/corp-ca.pem".to_string()),
                active: false,
                is_local_secret: true,
            },
            RegistryPreset {
                id: "artifactory-pip".to_string(),
                name: "JFrog Artifactory (PyPI/pip)".to_string(),
                tool: "pip".to_string(),
                registry_url:
                    "https://artifactory.mycorp.internal/artifactory/api/pypi/pypi-virtual/simple"
                        .to_string(),
                token: None,
                ca_cert_path: None,
                active: false,
                is_local_secret: true,
            },
            RegistryPreset {
                id: "artifactory-go".to_string(),
                name: "JFrog Artifactory (Go Proxy)".to_string(),
                tool: "go".to_string(),
                registry_url: "https://artifactory.mycorp.internal/artifactory/api/go/go-virtual"
                    .to_string(),
                token: None,
                ca_cert_path: None,
                active: false,
                is_local_secret: false,
            },
            RegistryPreset {
                id: "public-npm".to_string(),
                name: "Public NPM Registry".to_string(),
                tool: "npm".to_string(),
                registry_url: "https://registry.npmjs.org/".to_string(),
                token: None,
                ca_cert_path: None,
                active: true,
                is_local_secret: false,
            },
        ]
    }

    /// Writes configuration safely to `.mise.local.toml` to prevent leaking tokens to git
    pub fn apply_preset(
        preset: &RegistryPreset,
        workspace: Option<&str>,
        auth_token: Option<&str>,
    ) -> Result<String, String> {
        let target_dir = match workspace {
            Some(w) => w.to_string(),
            None => {
                let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                format!("{}/.config/mise", home)
            }
        };

        let file_path = format!("{}/.mise.local.toml", target_dir);
        let path = Path::new(&file_path);

        // Ensure directory exists
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let mut content = if path.exists() {
            fs::read_to_string(path).unwrap_or_default()
        } else {
            String::new()
        };

        if !content.contains("[env]") {
            content.push_str("\n[env]\n");
        }

        match preset.tool.as_str() {
            "npm" | "node" => {
                content.push_str(&format!(
                    "NPM_CONFIG_REGISTRY = \"{}\"\n",
                    preset.registry_url
                ));
                if let Some(token) = auth_token {
                    content.push_str(&format!("NPM_TOKEN = \"{}\"\n", token));
                }
                if let Some(ref ca) = preset.ca_cert_path {
                    content.push_str(&format!("NODE_EXTRA_CA_CERTS = \"{}\"\n", ca));
                }
            }
            "pip" | "python" => {
                content.push_str(&format!("PIP_INDEX_URL = \"{}\"\n", preset.registry_url));
                if let Some(ref ca) = preset.ca_cert_path {
                    content.push_str(&format!("REQUESTS_CA_BUNDLE = \"{}\"\n", ca));
                }
            }
            "go" => {
                content.push_str(&format!("GOPROXY = \"{},direct\"\n", preset.registry_url));
            }
            _ => {}
        }

        fs::write(path, content).map_err(|e| format!("Failed to write to {}: {}", file_path, e))?;

        Ok(format!(
            "Successfully applied preset `{}` to {}",
            preset.name, file_path
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_presets() {
        let presets = PresetsManager::get_default_presets();
        assert!(presets.len() >= 3);
        assert!(presets.iter().any(|p| p.tool == "npm"));
        assert!(presets.iter().any(|p| p.tool == "pip"));
        assert!(presets.iter().any(|p| p.tool == "go"));
    }
}
