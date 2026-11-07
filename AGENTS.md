# AGENTS.md — AI Agent Operating Manual

> **Mission**: High-performance, cross-platform desktop GUI & environment controller for [mise](https://mise.jdx.dev), built with **Tauri v2**, **Rust**, **React 19**, and **Tailwind CSS**.

---

## 1. Fast Grounding & Non-Negotiables

- **Tech Stack**: Tauri v2 (`src-tauri/`) + React 19 + TypeScript (`src/`) + Zustand + Tailwind CSS v4 + Biome.
- **No Electron**: Do NOT propose or add Electron, Webpack, or ESLint.
- **Secret Protection**: **Never** write secrets or tokens to `.mise.toml`. Always write them to `.mise.local.toml` (git-ignored).
- **Linter/Formatter**: **Biome** only (`mise run lint` / `mise run lint:fix`). Do NOT run Prettier or ESLint.
- **Testing**: Vitest (`mise run test:ui`) + Rust Cargo Test (`mise run test:rs`).

---

## 2. Standard Mise Task Runner (Replaces Makefile)

All developer and CI tasks are unified under native `mise` tasks in `.mise.toml`:

```bash
# 1-Command Complete Health Check (Build + Lint + Clippy + UI Tests + Rust Tests)
mise run verify

# Individual Tasks
mise run dev         # Start Vite frontend dev server (port 1420)
mise run build       # Typecheck TypeScript and compile Vite frontend
mise run lint        # Check linting and formatting with Biome
mise run lint:fix    # Automatically fix lint & formatting issues
mise run clippy      # Run Rust Clippy with strict zero-warning policy (-D warnings)
mise run test:ui     # Run Vitest React/Zustand unit tests
mise run test:rs     # Run Rust backend unit tests
mise run test        # Concurrently run UI and Rust unit tests
```

---

## 3. Architecture & Code Layout

```
├── .mise.toml                # Project-level toolchain & mise tasks runner
├── AGENTS.md                 # This file: AI agent operating guidelines
├── STATUS.md                 # Living progress, milestones & active decisions
├── biome.json                # Biome linter & formatter configuration
├── src/                      # Frontend (React 19 + TypeScript + Zustand)
│   ├── components/           # Modular UI Tabs & Modals
│   │   ├── enterprise/       # Artifactory / Nexus preset manager
│   │   ├── diagnostics/      # 3-tier diagnostic inspector (Static, TLS, Runtime)
│   │   ├── registry/         # 941-tool catalog with lazy infinite scroll
│   │   ├── env/              # PATH inspector & .env.example audit
│   │   ├── tools/            # Installed tools & version manager
│   │   ├── editor/           # Visual .mise.toml / .mise.local.toml editor
│   │   └── layout/           # Header, Sidebar, Drawer
│   ├── store/useMiseStore.ts # Central Zustand state store
│   └── services/api.ts       # Dual-mode API: Tauri IPC in app, dev mock in browser
└── src-tauri/                # Native Rust Backend (Tauri v2)
    └── src/
        ├── lib.rs            # Tauri invoke_handler registration
        ├── mise_cli.rs       # mise CLI subprocess bridge
        ├── diagnostics.rs    # Multi-tier network probe & CLI executor
        ├── presets.rs        # Enterprise presets & .mise.local.toml manager
        ├── models.rs         # Strongly typed Serde models
        └── tray.rs           # Desktop system tray companion
```

---

## 4. Tauri IPC Command Matrix

| IPC Command           | Rust Function (`src-tauri/`)   | TypeScript Wrapper (`src/services/api.ts`) | Parameters & Purpose                                      |
| :-------------------- | :----------------------------- | :----------------------------------------- | :-------------------------------------------------------- |
| `get_installed_tools` | `mise_cli::list_installed`     | `api.getInstalledTools`                    | `{ workspace?: string }` — returns installed tool map     |
| `get_active_env`      | `mise_cli::get_env`            | `api.getActiveEnv`                         | `{ workspace?: string }` — returns resolved env map       |
| `get_registry`        | `mise_cli::get_registry`       | `api.getRegistry`                          | Fetches 940+ tools from `mise registry`                   |
| `diagnose_tool`       | `diagnostics::diagnose_tool`   | `api.diagnoseTool`                         | `{ tool: string, workspace?: string }` — multi-tier probe |
| `get_presets`         | `presets::get_default_presets` | `api.getPresets`                           | Default Artifactory / Nexus enterprise presets            |
| `apply_preset`        | `presets::apply_preset`        | `api.applyPreset`                          | Writes preset safely to `.mise.local.toml`                |
| `check_project_drift` | `mise_cli::check_drift`        | `api.checkProjectDrift`                    | Compares `.mise.toml` against installed tools             |
| `sync_workspace`      | `mise_cli::sync_workspace`     | `api.syncWorkspace`                        | Invokes `mise install` for workspace                      |
| `audit_env_template`  | `mise_cli::audit_env_template` | `api.auditEnvTemplate`                     | Compares `.env.example` vs active environment             |
| `save_config`         | `mise_cli::save_config`        | `api.saveConfig`                           | `{ filePath: string, content: string }`                   |

---

## 5. Token Protection & Ignore Rules

- **Avoid dumping huge files**:
  - `src/data/registry.json`: 941 items (~150 KB). Do NOT read in full; use slices or TypeScript interfaces.
  - `dist/` and `src-tauri/target/`: Generated build output.
  - `pnpm-lock.yaml`: ~55 KB lockfile.
- **Dual-Mode Headless Ergonomics**:
  - If working in a headless container without GUI/display server, run `mise run test` or `mise run build`. The frontend mock in `api.ts` allows complete browser testing without GTK/WebKit errors.
