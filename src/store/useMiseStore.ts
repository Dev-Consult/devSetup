import { create } from "zustand";
import {
	api,
	type ConfigFileInfo,
	type DiagnosticReport,
	type InstalledToolsMap,
	type PathDiagnostic,
	type ProjectSyncStatus,
	type RegistryPreset,
	type RegistryTool,
} from "../services/api";

export type ActiveTab =
	| "enterprise"
	| "diagnostics"
	| "tools"
	| "env"
	| "registry"
	| "config";

interface MiseState {
	// Navigation & Scope
	activeTab: ActiveTab;
	setActiveTab: (tab: ActiveTab) => void;
	workspace: string; // "global" | "project"
	setWorkspace: (ws: string) => void;
	loading: boolean;
	statusMessage: string | null;
	setStatusMessage: (msg: string | null) => void;

	// Data
	tools: InstalledToolsMap;
	presets: RegistryPreset[];
	envVars: Record<string, string>;
	pathDiag: PathDiagnostic | null;
	registryTools: RegistryTool[];
	syncStatus: ProjectSyncStatus | null;
	configFiles: ConfigFileInfo[];

	// Diagnostics
	diagTool: string;
	setDiagTool: (tool: string) => void;
	diagRunning: boolean;
	diagnosticReport: DiagnosticReport | null;
	runDiagnostic: () => Promise<void>;

	// Console Drawer
	terminalOpen: boolean;
	setTerminalOpen: (open: boolean) => void;
	terminalLogs: string[];
	addLog: (msg: string) => void;

	// Actions
	loadData: () => Promise<void>;
	applyPreset: (preset: RegistryPreset, token?: string) => Promise<void>;
	syncProject: () => Promise<void>;
	installTool: (tool: string, version: string) => Promise<void>;
	saveConfig: (filePath: string, content: string) => Promise<void>;
}

export const useMiseStore = create<MiseState>((set, get) => ({
	activeTab: "enterprise",
	setActiveTab: (tab) => set({ activeTab: tab }),
	workspace: "global",
	setWorkspace: (ws) => {
		set({ workspace: ws });
		get().loadData();
	},
	loading: false,
	statusMessage: null,
	setStatusMessage: (msg) => set({ statusMessage: msg }),

	tools: {},
	presets: [],
	envVars: {},
	pathDiag: null,
	registryTools: [],
	syncStatus: null,
	configFiles: [],

	diagTool: "npm",
	setDiagTool: (tool) => set({ diagTool: tool }),
	diagRunning: false,
	diagnosticReport: null,

	terminalOpen: false,
	setTerminalOpen: (open) => set({ terminalOpen: open }),
	terminalLogs: [
		"[System] Mise Desktop initialized.",
		"[Mise] Environment loaded: global (~/.config/mise/config.toml)",
	],
	addLog: (msg) => {
		const timestamp = new Date().toLocaleTimeString();
		set((state) => ({
			terminalLogs: [...state.terminalLogs, `[${timestamp}] ${msg}`],
		}));
	},

	loadData: async () => {
		set({ loading: true });
		const { workspace, addLog } = get();
		try {
			const wsParam =
				workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
			const [
				toolsRes,
				presetsRes,
				envRes,
				pathRes,
				regRes,
				syncRes,
				configsRes,
			] = await Promise.all([
				api.getInstalledTools(wsParam),
				api.getPresets(),
				api.getActiveEnv(wsParam),
				api.getPathDiagnostics(wsParam),
				api.getRegistry(),
				api.checkProjectDrift(wsParam),
				api.getConfigFiles(wsParam),
			]);

			set({
				tools: toolsRes,
				presets: presetsRes,
				envVars: envRes,
				pathDiag: pathRes,
				registryTools: regRes,
				syncStatus: syncRes,
				configFiles: configsRes,
			});
			addLog(`Refreshed data for ${workspace} scope.`);
		} catch (err) {
			console.error(err);
			addLog(`Failed to load data: ${err}`);
		} finally {
			set({ loading: false });
		}
	},

	runDiagnostic: async () => {
		const { diagTool, workspace, addLog } = get();
		set({ diagRunning: true, diagnosticReport: null });
		addLog(`Running multi-tier diagnostic probe for tool: ${diagTool}...`);
		try {
			const wsParam =
				workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
			const report = await api.diagnoseTool(diagTool, wsParam);
			set({ diagnosticReport: report });
			addLog(`Diagnostic completed: ${report.status_message}`);
		} catch (err) {
			console.error(err);
			addLog(`Diagnostic error: ${err}`);
		} finally {
			set({ diagRunning: false });
		}
	},

	applyPreset: async (preset, token) => {
		const { workspace, addLog, loadData } = get();
		set({ loading: true });
		try {
			const wsParam =
				workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
			addLog(`Applying preset ${preset.name} to ${workspace} scope...`);
			const msg = await api.applyPreset(preset, wsParam, token);
			set({ statusMessage: msg });
			addLog(msg);
			setTimeout(() => set({ statusMessage: null }), 4000);
			await loadData();
		} catch (err) {
			alert(`Error applying preset: ${err}`);
			addLog(`Failed to apply preset: ${err}`);
		} finally {
			set({ loading: false });
		}
	},

	syncProject: async () => {
		const { workspace, addLog, loadData } = get();
		set({ loading: true });
		addLog("Starting 1-Click Workspace Sync via 'mise install'...");
		try {
			const wsParam =
				workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
			const msg = await api.syncWorkspace(wsParam);
			set({ statusMessage: msg });
			addLog(msg);
			setTimeout(() => set({ statusMessage: null }), 4000);
			await loadData();
		} catch (err) {
			alert(`Sync error: ${err}`);
			addLog(`Sync error: ${err}`);
		} finally {
			set({ loading: false });
		}
	},

	installTool: async (tool, version) => {
		const { workspace, addLog, loadData } = get();
		set({ loading: true });
		addLog(`Installing ${tool}@${version}...`);
		try {
			const wsParam =
				workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
			const msg = await api.installTool(tool, version, wsParam);
			set({ statusMessage: msg });
			addLog(msg);
			setTimeout(() => set({ statusMessage: null }), 4000);
			await loadData();
		} catch (err) {
			alert(`Error installing tool: ${err}`);
			addLog(`Installation error: ${err}`);
		} finally {
			set({ loading: false });
		}
	},

	saveConfig: async (filePath, content) => {
		const { addLog, loadData } = get();
		set({ loading: true });
		try {
			const msg = await api.saveConfig(filePath, content);
			set({ statusMessage: msg });
			addLog(msg);
			setTimeout(() => set({ statusMessage: null }), 4000);
			await loadData();
		} catch (err) {
			alert(`Error saving config: ${err}`);
			addLog(`Config save error: ${err}`);
		} finally {
			set({ loading: false });
		}
	},
}));
