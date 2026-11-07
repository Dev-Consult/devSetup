# Mise Desktop 🚀

A high-performance, developer-centric desktop GUI and environment control center for [mise](https://mise.jdx.dev), built with **Tauri v2**, **Rust**, **React 19**, and **Tailwind CSS**.

---

## ✨ Features

### 1. 🏢 Enterprise Registry Presets & Secret Vault

- **1-Click Repointing**: Easily point package managers (`npm`, `pip`, `go`, `cargo`) to internal enterprise registries (e.g., **JFrog Artifactory**, **Sonatype Nexus**, or private mirrors).
- **Safe Credential Isolation**: API keys and bearer tokens are automatically written to `.mise.local.toml`. This file is ignored by Git, ensuring corporate tokens are **never leaked to source control**.
- **Corporate CA Assistant**: Auto-configures `NODE_EXTRA_CA_CERTS` and `REQUESTS_CA_BUNDLE` to eliminate `UNABLE_TO_VERIFY_LEAF_SIGNATURE` corporate proxy errors.

### 2. 🩺 Multi-Tier "Why Is It Broken?" Diagnostics

When installations or builds fail, run an instant multi-tier diagnostic:

- **Tier 1 (Static)**: Verifies presence and syntax of `NPM_CONFIG_REGISTRY`, `PIP_INDEX_URL`, `GOPROXY`, and corporate CA paths.
- **Tier 2 (Network & TLS Probe)**: Rapid 3-second non-blocking TCP/TLS handshake to Artifactory/Nexus endpoints to verify network reachability and VPN connectivity.
- **Tier 3 (Contextual CLI Ping)**: Executes `mise exec -- npm ping` or `pip config` inside the workspace scope to test real runtime authorization.
- **Actionable Remediation**: Actionable guidance for expired tokens, missing corporate certificates, or VPN disconnection.

### 3. ⚡ Project Drift Detection & 1-Click Sync

- Automatically detects if the current project workspace (`.mise.toml`, `mise.toml`, or `.tool-versions`) requires tools not yet installed on the machine.
- Provides a **1-Click Sync** button that invokes `mise install` to concurrently install all required runtimes.

### 4. 📦 Tool Discovery & Version Switcher

- View installed tools with active vs. requested versions.
- Fetch remote versions from `mise registry` on demand and switch versions instantly with a single click.

### 5. 🌐 Environment & PATH Conflict Inspector

- Searchable live table of all resolved environment variables.
- Visual PATH resolution order with automatic conflict detection (e.g. system `/usr/bin` shadowing mise-managed versions).

---

## 🛠️ Architecture

```
+-------------------------------------------------------------------------+
|                         Frontend (Webview)                              |
|           React 19 + TypeScript + Vite + Tailwind CSS v4                |
|                                                                         |
|  [ Enterprise Presets ] [ Multi-Tier Diag ] [ Project Drift & Sync ]    |
+-------------------------------------------------------------------------+
                                    │  ▲
                     Tauri IPC      │  │ Streaming Events & Logs
                     (invoke RPC)   │  │
                                    ▼  │
+-------------------------------------------------------------------------+
|                         Tauri Rust Backend                              |
|                                                                         |
|  ┌─────────────────────┐  ┌───────────────────┐  ┌───────────────────┐  |
|  |   MiseCliService    |  | DiagnosticsEngine |  |  PresetsManager   |  |
|  |  (JSON CLI wrapper) |  | (Network & TLS)   |  | (.mise.local.toml)|  |
|  └─────────────────────┘  └───────────────────┘  └───────────────────┘  |
+-------------------------------------------------------------------------+
                                    │
                         Subprocess Exec (CLI)
                                    ▼
+-------------------------------------------------------------------------+
|                           `mise` CLI Engine                             |
+-------------------------------------------------------------------------+
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js & pnpm (`mise use -g node pnpm`)
- Rust toolchain (`mise use -g rust`)
- `mise` CLI installed

### 1. Run Development Server (Browser Mode)

```bash
pnpm install
pnpm dev
```
Open **`http://localhost:1420/`** to interact with the full UI with live HMR.

### 2. Run Backend Unit & Integration Tests

```bash
pnpm test
```
Runs the Rust test suite verifying binary discovery, JSON serialization, diagnostic URL parsing, and preset configuration.

### 3. Build & Run Native Desktop Window (Linux / WSL2)

Install the Linux GTK and D-Bus development packages:

```bash
sudo apt update && sudo apt install -y pkg-config libdbus-1-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev build-essential
```

Then run:

```bash
pnpm tauri dev
```

To build a standalone production bundle (`.deb` / `AppImage`):

```bash
pnpm tauri build
```
