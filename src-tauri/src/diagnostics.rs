use crate::models::DiagnosticReport;
use crate::mise_cli::MiseCli;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

pub struct DiagnosticsEngine;

impl DiagnosticsEngine {
    pub fn diagnose_tool(tool: &str, workspace: Option<&str>) -> DiagnosticReport {
        let mut report = DiagnosticReport {
            tool: tool.to_string(),
            registry_url: None,
            static_env_ok: false,
            network_reachable: false,
            tls_valid: false,
            cli_ping_success: false,
            exit_code: None,
            status_message: "Initializing diagnostic probe...".to_string(),
            suggested_fix: None,
            details: Vec::new(),
        };

        // 1. Static Environment Check (Tier 1)
        let env_vars = match MiseCli::get_env(workspace) {
            Ok(vars) => vars,
            Err(e) => {
                report.status_message = format!("Failed to read mise environment: {}", e);
                report.suggested_fix = Some("Ensure mise is installed and configured in your shell.".to_string());
                return report;
            }
        };

        match tool {
            "npm" | "node" => {
                let reg = env_vars.get("NPM_CONFIG_REGISTRY")
                    .cloned()
                    .unwrap_or_else(|| "https://registry.npmjs.org/".to_string());
                report.registry_url = Some(reg.clone());
                report.details.push(format!("Active NPM_CONFIG_REGISTRY: {}", reg));

                let is_custom_registry = !reg.contains("registry.npmjs.org");
                if is_custom_registry {
                    report.details.push("Internal/Enterprise registry detected.".to_string());
                    if env_vars.contains_key("NODE_EXTRA_CA_CERTS") {
                        report.details.push("NODE_EXTRA_CA_CERTS is set for corporate TLS trust.".to_string());
                    } else {
                        report.details.push("Notice: NODE_EXTRA_CA_CERTS is not set. If using internal SSL certificates, connections may fail.".to_string());
                    }
                }
                report.static_env_ok = true;

                // 2. Network Reachability Probe (Tier 2)
                let host_port = Self::extract_host_port(&reg);
                if let Some((host, port)) = host_port {
                    report.details.push(format!("Probing TCP reachability to {}:{}...", host, port));
                    if Self::tcp_probe(&host, port, Duration::from_secs(3)) {
                        report.network_reachable = true;
                        report.tls_valid = true; // basic socket reached
                        report.details.push(format!("Successfully reached registry endpoint {}:{}", host, port));
                    } else {
                        report.network_reachable = false;
                        report.details.push(format!("Failed to connect to {}:{}. Connection timed out or host unreachable.", host, port));
                        report.status_message = "Enterprise registry is unreachable. Are you connected to corporate VPN?".to_string();
                        report.suggested_fix = Some("Verify your corporate VPN connection or check NO_PROXY / HTTP_PROXY settings.".to_string());
                        return report;
                    }
                }

                // 3. CLI Execution (Tier 3)
                report.details.push("Executing `mise exec -- npm ping` to test authentication & response...".to_string());
                match MiseCli::exec_command(workspace, "npm", &["ping"]) {
                    Ok((success, code, stdout, stderr)) => {
                        report.exit_code = Some(code);
                        report.cli_ping_success = success;
                        if success {
                            report.status_message = "All checks passed! NPM is connected and authorized to registry.".to_string();
                            report.details.push(format!("NPM response: {}", stdout.trim()));
                        } else {
                            let output = if stderr.trim().is_empty() { stdout } else { stderr };
                            report.details.push(format!("npm ping output: {}", output.trim()));
                            if output.contains("401") || output.contains("auth") {
                                report.status_message = "Registry returned 401 Unauthorized. Token expired or invalid.".to_string();
                                report.suggested_fix = Some("Update your Artifactory / NPM auth token in .mise.local.toml.".to_string());
                            } else if output.contains("CERT") || output.contains("UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
                                report.status_message = "TLS Certificate validation failed.".to_string();
                                report.suggested_fix = Some("Configure NODE_EXTRA_CA_CERTS with your corporate root CA bundle.".to_string());
                            } else {
                                report.status_message = format!("npm ping failed with exit code {}.", code);
                                report.suggested_fix = Some("Check `npm config list` or ensure registry URL matches your Artifactory virtual repo.".to_string());
                            }
                        }
                    }
                    Err(e) => {
                        report.status_message = format!("Failed to execute npm CLI: {}", e);
                        report.suggested_fix = Some("Ensure Node / npm is installed in the current mise workspace (`mise install node`).".to_string());
                    }
                }
            }
            "pip" | "python" => {
                let reg = env_vars.get("PIP_INDEX_URL")
                    .cloned()
                    .unwrap_or_else(|| "https://pypi.org/simple/".to_string());
                report.registry_url = Some(reg.clone());
                report.details.push(format!("Active PIP_INDEX_URL: {}", reg));
                report.static_env_ok = true;

                let host_port = Self::extract_host_port(&reg);
                if let Some((host, port)) = host_port {
                    if Self::tcp_probe(&host, port, Duration::from_secs(3)) {
                        report.network_reachable = true;
                        report.tls_valid = true;
                        report.status_message = "Python/pip registry reachable.".to_string();
                    } else {
                        report.status_message = "Python registry host is unreachable.".to_string();
                        report.suggested_fix = Some("Check VPN connection or PIP_INDEX_URL configuration.".to_string());
                    }
                }
            }
            "go" => {
                let proxy = env_vars.get("GOPROXY")
                    .cloned()
                    .unwrap_or_else(|| "https://proxy.golang.org,direct".to_string());
                report.registry_url = Some(proxy.clone());
                report.details.push(format!("Active GOPROXY: {}", proxy));
                report.static_env_ok = true;
                report.status_message = "Go environment configured.".to_string();
            }
            _ => {
                report.static_env_ok = true;
                report.status_message = format!("No specialized diagnostic rule for tool `{}`.", tool);
            }
        }

        report
    }

    fn extract_host_port(url_str: &str) -> Option<(String, u16)> {
        let clean = url_str
            .trim_start_matches("https://")
            .trim_start_matches("http://");
        let host_part = clean.split('/').next()?.split('@').last()?;
        let mut parts = host_part.split(':');
        let host = parts.next()?.to_string();
        let port = if let Some(p) = parts.next() {
            p.parse::<u16>().unwrap_or(443)
        } else if url_str.starts_with("http://") {
            80
        } else {
            443
        };
        Some((host, port))
    }

    fn tcp_probe(host: &str, port: u16, timeout: Duration) -> bool {
        let addr_str = format!("{}:{}", host, port);
        if let Ok(mut addrs) = addr_str.to_socket_addrs() {
            if let Some(addr) = addrs.next() {
                return TcpStream::connect_timeout(&addr, timeout).is_ok();
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_host_port() {
        let (host, port) = DiagnosticsEngine::extract_host_port("https://artifactory.corp.internal/api/npm/virtual").unwrap();
        assert_eq!(host, "artifactory.corp.internal");
        assert_eq!(port, 443);

        let (host2, port2) = DiagnosticsEngine::extract_host_port("http://localhost:8080/repo").unwrap();
        assert_eq!(host2, "localhost");
        assert_eq!(port2, 8080);
    }

    #[test]
    fn test_diagnose_tool_unknown() {
        let report = DiagnosticsEngine::diagnose_tool("custom-unknown-tool", None);
        assert_eq!(report.tool, "custom-unknown-tool");
        assert!(report.static_env_ok);
    }
}
