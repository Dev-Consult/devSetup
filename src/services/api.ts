// API Client: Dual-mode (Tauri IPC when inside desktop app, realistic dev bridge in browser)

export interface ToolVersionInfo {
	version: string;
	requested_version?: string;
	install_path?: string;
	installed: boolean;
	active: boolean;
}

export type InstalledToolsMap = Record<string, ToolVersionInfo[]>;

export interface RegistryTool {
	name: string;
	full_name: string;
	backend: string;
	description?: string;
}

export interface RegistryPreset {
	id: string;
	name: string;
	tool: string;
	registry_url: string;
	token?: string;
	ca_cert_path?: string;
	active: boolean;
	is_local_secret: boolean;
}

export interface DiagnosticReport {
	tool: string;
	registry_url?: string;
	static_env_ok: boolean;
	network_reachable: boolean;
	tls_valid: boolean;
	cli_ping_success: boolean;
	exit_code?: number;
	status_message: string;
	suggested_fix?: string;
	details: string[];
}

export interface PathDiagnostic {
	path_entries: string[];
	conflicts: string[];
	mise_active: boolean;
}

export interface ProjectDriftTool {
	name: string;
	requested_version: string;
	installed_version?: string;
	is_satisfied: boolean;
}

export interface ProjectSyncStatus {
	workspace_path: string;
	config_file_found: boolean;
	config_file_path?: string;
	is_in_sync: boolean;
	missing_tools: ProjectDriftTool[];
}

export interface ConfigFileInfo {
	file_type: "global" | "project" | "local_secret";
	path: string;
	exists: boolean;
	content: string;
}

const isTauri = () =>
	typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function invokeTauri<T>(
	cmd: string,
	args: Record<string, unknown> = {},
): Promise<T> {
	if (isTauri()) {
		const { invoke } = await import("@tauri-apps/api/core");
		return invoke<T>(cmd, args);
	}
	return mockInvoke<T>(cmd, args);
}

// Mock fallback for browser preview / Vite dev mode
async function mockInvoke<T>(
	cmd: string,
	args: Record<string, unknown>,
): Promise<T> {
	console.log(`[API Mock] ${cmd}`, args);
	await new Promise((r) => setTimeout(r, 200));

	if (cmd === "get_installed_tools") {
		return {
			node: [
				{
					version: "24.13.0",
					requested_version: "24",
					installed: true,
					active: true,
				},
				{
					version: "22.12.0",
					requested_version: "22",
					installed: true,
					active: false,
				},
			],
			rust: [
				{
					version: "1.99.1",
					requested_version: "latest",
					installed: true,
					active: true,
				},
			],
			python: [
				{
					version: "3.12.2",
					requested_version: "3.12",
					installed: true,
					active: true,
				},
			],
			age: [
				{
					version: "1.3.2",
					requested_version: "latest",
					installed: true,
					active: true,
				},
			],
		} as unknown as T;
	}

	if (cmd === "get_active_env") {
		return {
			MISE_SHELL: "zsh",
			NPM_CONFIG_REGISTRY:
				"https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/",
			NODE_EXTRA_CA_CERTS: "/etc/ssl/certs/corp-ca.pem",
			PIP_INDEX_URL:
				"https://artifactory.mycorp.internal/artifactory/api/pypi/pypi-virtual/simple",
			GOPROXY:
				"https://artifactory.mycorp.internal/artifactory/api/go/go-virtual,direct",
			PATH: "/home/daniel/.local/share/mise/installs/node/24.13.0/bin:/home/daniel/.local/share/mise/installs/rust/1.99.1/bin:/home/daniel/.local/bin:/usr/bin:/bin",
		} as unknown as T;
	}

	if (cmd === "get_registry") {
		return [
			{
				name: "node",
				full_name: "core:node",
				backend: "core",
				description: "Node.js JavaScript runtime",
			},
			{
				name: "python",
				full_name: "core:python",
				backend: "core",
				description: "Python programming language",
			},
			{
				name: "go",
				full_name: "core:go",
				backend: "core",
				description: "Go programming language",
			},
			{
				name: "rust",
				full_name: "core:rust",
				backend: "core",
				description: "Rust compiler and toolchain",
			},
			{
				name: "bun",
				full_name: "core:bun",
				backend: "core",
				description: "Fast all-in-one JavaScript runtime & package manager",
			},
			{
				name: "deno",
				full_name: "core:deno",
				backend: "core",
				description: "Secure runtime for JavaScript and TypeScript",
			},
			{
				name: "ruby",
				full_name: "core:ruby",
				backend: "core",
				description: "Dynamic open source programming language",
			},
			{
				name: "java",
				full_name: "core:java",
				backend: "core",
				description: "Java Development Kit (OpenJDK)",
			},
			{
				name: "zig",
				full_name: "core:zig",
				backend: "core",
				description: "General-purpose programming language and toolchain",
			},
			{
				name: "terraform",
				full_name: "aqua:hashicorp/terraform",
				backend: "aqua",
				description: "Infrastructure as Code tool for cloud provisioning",
			},
			{
				name: "kubectl",
				full_name: "aqua:kubernetes/kubernetes/kubectl",
				backend: "aqua",
				description: "Kubernetes command-line tool",
			},
			{
				name: "helm",
				full_name: "aqua:helm/helm",
				backend: "aqua",
				description: "The package manager for Kubernetes",
			},
			{
				name: "k9s",
				full_name: "aqua:derailed/k9s",
				backend: "aqua",
				description: "Terminal UI to monitor and manage Kubernetes clusters",
			},
			{
				name: "gh",
				full_name: "aqua:cli/cli",
				backend: "aqua",
				description: "GitHub's official command line tool",
			},
			{
				name: "aws-cli",
				full_name: "aqua:aws/aws-cli",
				backend: "aqua",
				description: "Official AWS command line interface",
			},
			{
				name: "uv",
				full_name: "aqua:astral-sh/uv",
				backend: "aqua",
				description: "Extremely fast Python package installer and resolver",
			},
			{
				name: "ripgrep",
				full_name: "aqua:BurntSushi/ripgrep",
				backend: "aqua",
				description: "Fast line-oriented search tool",
			},
			{
				name: "fzf",
				full_name: "aqua:junegunn/fzf",
				backend: "aqua",
				description: "Command-line fuzzy finder",
			},
			{
				name: "jq",
				full_name: "aqua:jqlang/jq",
				backend: "aqua",
				description: "Command-line JSON processor",
			},
			{
				name: "bat",
				full_name: "aqua:sharkdp/bat",
				backend: "aqua",
				description: "Cat clone with syntax highlighting and Git integration",
			},
			{
				name: "pre-commit",
				full_name: "aqua:pre-commit/pre-commit",
				backend: "aqua",
				description: "Multi-language pre-commit hooks manager",
			},
			{
				name: "tflint",
				full_name: "aqua:terraform-linters/tflint",
				backend: "aqua",
				description: "A Pluggable Terraform Linter",
			},
			{
				name: "eza",
				full_name: "cargo:eza",
				backend: "cargo",
				description: "Modern, maintained replacement for ls",
			},
			{
				name: "starship",
				full_name: "aqua:starship/starship",
				backend: "aqua",
				description: "Cross-shell customizable prompt",
			},
		] as unknown as T;
	}

	if (cmd === "get_presets") {
		return [
			{
				id: "artifactory-npm",
				name: "JFrog Artifactory (NPM)",
				tool: "npm",
				registry_url:
					"https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/",
				token: "cmVsZWFzZV90b2tlbl85ODcyMzQ...",
				ca_cert_path: "/etc/ssl/certs/corp-ca.pem",
				active: true,
				is_local_secret: true,
			},
			{
				id: "artifactory-pip",
				name: "JFrog Artifactory (PyPI/pip)",
				tool: "pip",
				registry_url:
					"https://artifactory.mycorp.internal/artifactory/api/pypi/pypi-virtual/simple",
				token: undefined,
				ca_cert_path: "/etc/ssl/certs/corp-ca.pem",
				active: true,
				is_local_secret: true,
			},
			{
				id: "public-npm",
				name: "Public NPM Registry",
				tool: "npm",
				registry_url: "https://registry.npmjs.org/",
				active: false,
				is_local_secret: false,
			},
		] as unknown as T;
	}

	if (cmd === "diagnose_tool") {
		const tool = (args.tool as string) || "npm";
		return {
			tool,
			registry_url:
				"https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/",
			static_env_ok: true,
			network_reachable: true,
			tls_valid: true,
			cli_ping_success: true,
			exit_code: 0,
			status_message:
				"All checks passed! NPM is connected and authorized to Artifactory.",
			details: [
				"Active NPM_CONFIG_REGISTRY: https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/",
				"NODE_EXTRA_CA_CERTS is configured: /etc/ssl/certs/corp-ca.pem",
				"Successfully connected to artifactory.mycorp.internal:443 (TCP handshake 34ms)",
				"Executed `mise exec -- npm ping`: Notice [OK] 200 Pong from JFrog Artifactory",
			],
		} as unknown as T;
	}

	if (cmd === "get_path_diagnostics") {
		return {
			path_entries: [
				"~/.local/share/mise/installs/node/24.13.0/bin",
				"~/.local/share/mise/installs/rust/1.99.1/bin",
				"~/.local/bin",
				"/usr/local/bin",
				"/usr/bin",
			],
			conflicts: [],
			mise_active: true,
		} as unknown as T;
	}

	if (cmd === "get_remote_versions") {
		const tool = args.tool as string;
		if (tool === "node")
			return [
				"24.13.0",
				"24.12.0",
				"22.14.0",
				"22.12.0",
				"20.18.3",
				"18.20.7",
			] as unknown as T;
		if (tool === "python")
			return [
				"3.13.1",
				"3.12.9",
				"3.12.2",
				"3.11.11",
				"3.10.16",
			] as unknown as T;
		if (tool === "go") return ["1.24.0", "1.23.6", "1.22.12"] as unknown as T;
		if (tool === "rust") return ["1.99.1", "1.98.0", "1.97.0"] as unknown as T;
		return ["latest", "2.0.0", "1.0.0"] as unknown as T;
	}

	if (cmd === "check_project_drift") {
		const isProject = args.workspace !== undefined;
		return {
			workspace_path: (args.workspace as string) || "/home/daniel/dev/mise-gui",
			config_file_found: true,
			config_file_path: isProject
				? "/home/daniel/dev/mise-gui/.mise.toml"
				: "/home/daniel/.config/mise/config.toml",
			is_in_sync: !isProject, // In project mode, simulate 2 drift tools
			missing_tools: isProject
				? [
						{
							name: "python",
							requested_version: "3.11.8",
							installed_version: "3.12.2",
							is_satisfied: false,
						},
						{
							name: "golang",
							requested_version: "1.22.4",
							installed_version: undefined,
							is_satisfied: false,
						},
					]
				: [],
		} as unknown as T;
	}

	if (cmd === "sync_workspace") {
		return "All workspace tools synchronized successfully via `mise install`!" as unknown as T;
	}

	if (cmd === "get_config_files") {
		return [
			{
				file_type: "global",
				path: "/home/daniel/.config/mise/config.toml",
				exists: true,
				content: `# Global Mise Configuration (~/.config/mise/config.toml)
[tools]
node = "24.13.0"
rust = "1.99.1"
python = "3.12.2"
age = "1.3.2"

[env]
MISE_SHELL = "zsh"
NODE_EXTRA_CA_CERTS = "/etc/ssl/certs/corp-ca.pem"
NPM_CONFIG_REGISTRY = "https://artifactory.mycorp.internal/artifactory/api/npm/npm-virtual/"
`,
			},
			{
				file_type: "local_secret",
				path: "/home/daniel/dev/mise-gui/.mise.local.toml",
				exists: true,
				content: `# Local Secrets & Overrides (Automatically Git-Ignored)
[env]
NPM_TOKEN = "cmVsZWFzZV90b2tlbl85ODcyMzQ..."
ARTIFACTORY_USER = "daniel"
`,
			},
		] as unknown as T;
	}

	if (cmd === "save_config") {
		return `Saved to ${args.file_path}` as unknown as T;
	}

	if (cmd === "apply_preset") {
		return "Preset applied to .mise.local.toml safely!" as unknown as T;
	}

	if (cmd === "install_tool") {
		return `Successfully installed ${args.tool}@${args.version}` as unknown as T;
	}

	throw new Error(`Unhandled mock command: ${cmd}`);
}

export const api = {
	getInstalledTools: (workspace?: string) =>
		invokeTauri<InstalledToolsMap>("get_installed_tools", { workspace }),
	getActiveEnv: (workspace?: string) =>
		invokeTauri<Record<string, string>>("get_active_env", { workspace }),
	getRegistry: () => invokeTauri<RegistryTool[]>("get_registry"),
	getDoctor: (workspace?: string) =>
		invokeTauri<string>("get_doctor", { workspace }),
	getPathDiagnostics: (workspace?: string) =>
		invokeTauri<PathDiagnostic>("get_path_diagnostics", { workspace }),
	diagnoseTool: (tool: string, workspace?: string) =>
		invokeTauri<DiagnosticReport>("diagnose_tool", { tool, workspace }),
	getPresets: () => invokeTauri<RegistryPreset[]>("get_presets"),
	getRemoteVersions: (tool: string) =>
		invokeTauri<string[]>("get_remote_versions", { tool }),
	checkProjectDrift: (workspace?: string) =>
		invokeTauri<ProjectSyncStatus>("check_project_drift", { workspace }),
	syncWorkspace: (workspace?: string) =>
		invokeTauri<string>("sync_workspace", { workspace }),
	getConfigFiles: (workspace?: string) =>
		invokeTauri<ConfigFileInfo[]>("get_config_files", { workspace }),
	saveConfig: (filePath: string, content: string) =>
		invokeTauri<string>("save_config", { filePath, content }),
	applyPreset: (preset: RegistryPreset, workspace?: string, token?: string) =>
		invokeTauri<string>("apply_preset", { preset, workspace, token }),
	installTool: (tool: string, version: string, workspace?: string) =>
		invokeTauri<string>("install_tool", { tool, version, workspace }),
};
