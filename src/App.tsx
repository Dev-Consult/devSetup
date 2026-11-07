import { useState, useEffect } from "react";
import {
  api,
  InstalledToolsMap,
  RegistryPreset,
  DiagnosticReport,
  PathDiagnostic,
  RegistryTool,
  ProjectSyncStatus,
  ConfigFileInfo,
} from "./services/api";
import {
  Wrench,
  ShieldCheck,
  Activity,
  Layers,
  Search,
  RefreshCw,
  FolderGit2,
  Globe,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  Play,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  FileCode2,
  Save,
} from "lucide-react";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"tools" | "enterprise" | "diagnostics" | "env" | "registry" | "config">("enterprise");
  const [workspace, setWorkspace] = useState<string>("global");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Data states
  const [tools, setTools] = useState<InstalledToolsMap>({});
  const [presets, setPresets] = useState<RegistryPreset[]>([]);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [pathDiag, setPathDiag] = useState<PathDiagnostic | null>(null);
  const [registryTools, setRegistryTools] = useState<RegistryTool[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [diagTool, setDiagTool] = useState<string>("npm");
  const [diagRunning, setDiagRunning] = useState<boolean>(false);

  // Config Files & Visual Editor state
  const [configFiles, setConfigFiles] = useState<ConfigFileInfo[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [editorText, setEditorText] = useState<string>("");
  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Project Drift & Sync State
  const [syncStatus, setSyncStatus] = useState<ProjectSyncStatus | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Terminal & Logs Drawer
  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[System] Mise Desktop initialized.",
    "[Mise] Environment loaded: global (~/.config/mise/config.toml)",
  ]);

  // Version Switching Modal state
  const [switchingTool, setSwitchingTool] = useState<string | null>(null);
  const [remoteVersions, setRemoteVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("latest");
  const [fetchingVersions, setFetchingVersions] = useState<boolean>(false);

  // Add Custom Preset Modal
  const [customPresetModal, setCustomPresetModal] = useState<boolean>(false);
  const [newPreset, setNewPreset] = useState<Partial<RegistryPreset>>({
    name: "Internal Artifactory",
    tool: "npm",
    registry_url: "https://artifactory.corp.internal/api/npm/virtual",
    ca_cert_path: "/etc/ssl/certs/corp-ca.pem",
    is_local_secret: true,
  });

  // UI helpers
  const [toolSearch, setToolSearch] = useState<string>("");
  const [envSearch, setEnvSearch] = useState<string>("");
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [editingToken, setEditingToken] = useState<Record<string, string>>({});

  const logMessage = (msg: string) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const wsParam = workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
      const [toolsRes, presetsRes, envRes, pathRes, regRes, syncRes, configsRes] = await Promise.all([
        api.getInstalledTools(wsParam),
        api.getPresets(),
        api.getActiveEnv(wsParam),
        api.getPathDiagnostics(wsParam),
        api.getRegistry(),
        api.checkProjectDrift(wsParam),
        api.getConfigFiles(wsParam),
      ]);
      setTools(toolsRes);
      setPresets(presetsRes);
      setEnvVars(envRes);
      setPathDiag(pathRes);
      setRegistryTools(regRes.slice(0, 50));
      setSyncStatus(syncRes);
      setConfigFiles(configsRes);
      if (!isEditorDirty && configsRes.length > 0) {
        setEditorText(configsRes[selectedFileIdx]?.content || configsRes[0].content);
      }
      logMessage(`Refreshed data for ${workspace} scope. In sync: ${syncRes.is_in_sync}`);
    } catch (err) {
      console.error(err);
      logMessage(`Error loading data: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspace]);

  const handleRunDiagnostic = async () => {
    setDiagRunning(true);
    setDiagnosticReport(null);
    logMessage(`Running multi-tier diagnostic probe for tool: ${diagTool}...`);
    try {
      const wsParam = workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
      const res = await api.diagnoseTool(diagTool, wsParam);
      setDiagnosticReport(res);
      logMessage(`Diagnostic completed: ${res.status_message}`);
    } catch (err) {
      console.error(err);
      logMessage(`Diagnostic error: ${err}`);
    } finally {
      setDiagRunning(false);
    }
  };

  const handleSyncWorkspace = async () => {
    setSyncing(true);
    logMessage(`Starting 1-Click Workspace Sync via 'mise install'...`);
    try {
      const wsParam = workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
      const res = await api.syncWorkspace(wsParam);
      setStatusMessage(res);
      logMessage(res);
      setTimeout(() => setStatusMessage(null), 4000);
      await loadData();
    } catch (err) {
      alert(`Sync error: ${err}`);
      logMessage(`Sync error: ${err}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectConfigFile = (idx: number) => {
    setSelectedFileIdx(idx);
    setEditorText(configFiles[idx]?.content || "");
    setIsEditorDirty(false);
  };

  const handleSaveEditor = async () => {
    const currentFile = configFiles[selectedFileIdx];
    if (!currentFile) return;
    setSavingConfig(true);
    logMessage(`Saving configuration to ${currentFile.path}...`);
    try {
      const res = await api.saveConfig(currentFile.path, editorText);
      setStatusMessage(res);
      logMessage(res);
      setIsEditorDirty(false);
      setTimeout(() => setStatusMessage(null), 4000);
      await loadData();
    } catch (err) {
      alert(`Error saving config: ${err}`);
      logMessage(`Error saving config: ${err}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApplyPreset = async (preset: RegistryPreset) => {
    try {
      setLoading(true);
      const wsParam = workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
      const token = editingToken[preset.id];
      logMessage(`Applying preset ${preset.name} to ${workspace} scope...`);
      const msg = await api.applyPreset(preset, wsParam, token);
      setStatusMessage(msg);
      logMessage(msg);
      setTimeout(() => setStatusMessage(null), 4000);
      await loadData();
    } catch (err) {
      alert(`Error applying preset: ${err}`);
      logMessage(`Failed to apply preset: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const openVersionSwitcher = async (tool: string) => {
    setSwitchingTool(tool);
    setFetchingVersions(true);
    try {
      const list = await api.getRemoteVersions(tool);
      setRemoteVersions(list);
      setSelectedVersion(list[0] || "latest");
    } catch (e) {
      console.error(e);
      setRemoteVersions(["latest"]);
    } finally {
      setFetchingVersions(false);
    }
  };

  const handleSwitchVersion = async () => {
    if (!switchingTool) return;
    try {
      setLoading(true);
      const wsParam = workspace === "global" ? undefined : "/home/daniel/dev/mise-gui";
      logMessage(`Switching ${switchingTool} to version ${selectedVersion}...`);
      const msg = await api.installTool(switchingTool, selectedVersion, wsParam);
      setStatusMessage(msg);
      logMessage(msg);
      setTimeout(() => setStatusMessage(null), 4000);
      setSwitchingTool(null);
      await loadData();
    } catch (err) {
      alert(`Error switching version: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomPreset = () => {
    if (!newPreset.name || !newPreset.registry_url) return;
    const created: RegistryPreset = {
      id: `custom-${Date.now()}`,
      name: newPreset.name,
      tool: newPreset.tool || "npm",
      registry_url: newPreset.registry_url,
      token: newPreset.token,
      ca_cert_path: newPreset.ca_cert_path,
      active: true,
      is_local_secret: true,
    };
    setPresets([created, ...presets]);
    setCustomPresetModal(false);
    handleApplyPreset(created);
  };

  const toggleReveal = (key: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0e14] text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1e2333] bg-[#0f121b] flex flex-col justify-between p-4">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shadow-md shadow-indigo-600/20">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white tracking-wide text-sm">Mise Desktop</h1>
              <p className="text-[11px] text-gray-400">Dev Tools & Env Control</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("enterprise")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "enterprise"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise & Artifactory</span>
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "diagnostics"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Multi-Tier Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveTab("tools")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "tools"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Installed Tools</span>
            </button>

            <button
              onClick={() => setActiveTab("env")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "env"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Env & PATH Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab("registry")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "registry"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Tool Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("config")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "config"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>Config TOML Editor</span>
            </button>
          </nav>
        </div>

        {/* System Health Summary Pill */}
        <div className="space-y-3">
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#151924] hover:bg-[#1c2231] border border-[#23293d] rounded-lg text-xs text-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Console Logs</span>
            </div>
            {terminalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <div className="bg-[#151924] border border-[#23293d] rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-400">Mise Engine</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {Object.keys(tools).length} runtimes managed
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#1e2333] bg-[#0f121b]/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-gray-400">Scope:</span>
            <div className="flex items-center bg-[#151924] border border-[#23293d] rounded-lg p-1 space-x-1">
              <button
                onClick={() => setWorkspace("global")}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  workspace === "global"
                    ? "bg-[#252c40] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Global (~/.config/mise)
              </button>
              <button
                onClick={() => setWorkspace("project")}
                className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  workspace === "project"
                    ? "bg-[#252c40] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Project Workspace</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#171c29] hover:bg-[#20273a] text-gray-300 border border-[#262e45] rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Notification Banner */}
        {statusMessage && (
          <div className="bg-indigo-600/20 border-b border-indigo-500/40 px-6 py-2 flex items-center space-x-2 text-xs text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Project Drift & Onboarding Sync Banner */}
          {syncStatus && !syncStatus.is_in_sync && (
            <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm text-white">
                      Project Drift Detected — Missing Runtimes
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {syncStatus.missing_tools.length} Unmet Requirements
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    This project requires specific versions defined in{" "}
                    <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">
                      {syncStatus.config_file_path || ".mise.toml"}
                    </code>{" "}
                    that are not installed on your machine:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {syncStatus.missing_tools.map((t) => (
                      <span
                        key={t.name}
                        className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono bg-black/50 border border-white/10 text-gray-200"
                      >
                        <span className="text-indigo-400 mr-1">{t.name}@</span>
                        <span>{t.requested_version}</span>
                        {t.installed_version && (
                          <span className="text-gray-500 text-[10px] ml-1.5">
                            (active: {t.installed_version})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <button
                  onClick={handleSyncWorkspace}
                  disabled={syncing}
                  className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 text-amber-300 ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing Tools..." : "1-Click Sync Project"}</span>
                </button>
              </div>
            </div>
          )}

          {syncStatus && syncStatus.is_in_sync && workspace === "project" && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Workspace is fully synchronized with {syncStatus.config_file_path || ".mise.toml"}.</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-mono">All Runtimes Ready</span>
            </div>
          )}
          {/* TAB 1: Enterprise & Artifactory Presets */}
          {activeTab === "enterprise" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Enterprise Registry Presets</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Repoint your package managers (<span className="text-indigo-400 font-mono">npm</span>,{" "}
                    <span className="text-indigo-400 font-mono">pip</span>,{" "}
                    <span className="text-indigo-400 font-mono">go</span>) to JFrog Artifactory or internal mirrors.
                  </p>
                </div>
                <button
                  onClick={() => setCustomPresetModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Registry</span>
                </button>
              </div>

              {/* Security Banner */}
              <div className="flex items-start space-x-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-300">Safe Token Isolation</h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Credentials entered below are automatically saved to{" "}
                    <code className="bg-emerald-950/60 px-1 py-0.5 rounded text-emerald-300">.mise.local.toml</code>.
                    This file is automatically ignored by Git, ensuring corporate tokens are never leaked to version control.
                  </p>
                </div>
              </div>

              {/* Presets List */}
              <div className="grid grid-cols-1 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-[#121622] border border-[#20273a] rounded-xl p-5 hover:border-[#2f3954] transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          {preset.tool}
                        </span>
                        <h3 className="font-medium text-sm text-white">{preset.name}</h3>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          preset.active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {preset.active ? "Configured" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-gray-400 text-[11px] font-medium">Registry URL</label>
                        <div className="mt-1 font-mono text-[12px] bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-gray-300 truncate">
                          {preset.registry_url}
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-400 text-[11px] font-medium flex items-center justify-between">
                          <span>Auth Token / API Key (Optional)</span>
                          <span className="text-[10px] text-gray-500">Masked</span>
                        </label>
                        <div className="mt-1 flex items-center bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-1.5 focus-within:border-indigo-500">
                          <KeyRound className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
                          <input
                            type={revealedSecrets[preset.id] ? "text" : "password"}
                            placeholder="Enter Artifactory token..."
                            value={editingToken[preset.id] ?? preset.token ?? ""}
                            onChange={(e) =>
                              setEditingToken({ ...editingToken, [preset.id]: e.target.value })
                            }
                            className="bg-transparent border-none text-xs text-white focus:outline-none w-full font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleReveal(preset.id)}
                            className="text-gray-400 hover:text-gray-200"
                          >
                            {revealedSecrets[preset.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {preset.ca_cert_path && (
                      <div className="text-xs bg-[#171c29]/50 border border-[#232b40] rounded-lg px-3 py-2 text-gray-400 flex items-center justify-between">
                        <span>Corporate CA Bundle: <code className="text-gray-300 font-mono">{preset.ca_cert_path}</code></span>
                        <span className="text-[10px] text-indigo-400">Configures NODE_EXTRA_CA_CERTS</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-[#1d2334]">
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
                      >
                        Apply to {workspace === "global" ? "~/.config/mise" : ".mise.local.toml"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Multi-Tier Diagnostics */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-semibold text-white">Multi-Tier Environment Diagnostics</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Diagnose why package installations fail: inspects environment variables, probes TCP/TLS reachability to Artifactory, and runs live CLI checks.
                </p>
              </div>

              {/* Tool Selector & Run Bar */}
              <div className="bg-[#121622] border border-[#20273a] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 font-medium">Select Tool to Test:</span>
                  <select
                    value={diagTool}
                    onChange={(e) => setDiagTool(e.target.value)}
                    className="bg-[#0a0c12] border border-[#222a3d] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="npm">npm / Node.js</option>
                    <option value="pip">pip / Python</option>
                    <option value="go">go (GOPROXY)</option>
                  </select>
                </div>

                <button
                  onClick={handleRunDiagnostic}
                  disabled={diagRunning}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${diagRunning ? "animate-spin" : ""}`} />
                  <span>{diagRunning ? "Probing..." : "Run Diagnostic Probe"}</span>
                </button>
              </div>

              {/* Diagnostic Results Card */}
              {diagnosticReport && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`rounded-xl p-4 border flex items-start space-x-3 ${
                      diagnosticReport.cli_ping_success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {diagnosticReport.cli_ping_success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">
                        {diagnosticReport.cli_ping_success ? "Diagnostic Passed" : "Issue Detected"}
                      </h3>
                      <p className="text-xs mt-1 text-gray-300">{diagnosticReport.status_message}</p>
                      {diagnosticReport.suggested_fix && (
                        <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-yellow-300 flex items-start justify-between space-x-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span><strong>Recommended Fix:</strong> {diagnosticReport.suggested_fix}</span>
                          </div>
                          <button
                            onClick={() => setActiveTab("enterprise")}
                            className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 rounded text-[11px] font-semibold shrink-0 transition-colors"
                          >
                            Configure in Presets →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Tier Execution Breakdown */}
                  <div className="bg-[#121622] border border-[#20273a] rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Diagnostic Execution Steps
                    </h4>

                    <div className="space-y-3">
                      {/* Tier 1 */}
                      <div className="flex items-center justify-between text-xs border-b border-[#1c2233] pb-2.5">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-gray-200">Tier 1: Static Environment & Config Audit</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {diagnosticReport.static_env_ok ? "Variables Validated" : "Missing Vars"}
                        </span>
                      </div>

                      {/* Tier 2 */}
                      <div className="flex items-center justify-between text-xs border-b border-[#1c2233] pb-2.5">
                        <div className="flex items-center space-x-2">
                          {diagnosticReport.network_reachable ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-gray-200">Tier 2: Network & TLS Reachability Probe</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {diagnosticReport.network_reachable ? "Port 443 Handshake OK" : "Unreachable"}
                        </span>
                      </div>

                      {/* Tier 3 */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {diagnosticReport.cli_ping_success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-gray-200">Tier 3: Contextual Runtime Ping (`mise exec -- {diagTool} ping`)</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {diagnosticReport.cli_ping_success ? "Exit Code 0" : `Exit Code ${diagnosticReport.exit_code ?? 1}`}
                        </span>
                      </div>
                    </div>

                    {/* Execution Details Log */}
                    <div className="mt-4 bg-[#0a0c12] border border-[#1b2030] rounded-lg p-3 font-mono text-[11px] text-gray-300 space-y-1">
                      {diagnosticReport.details.map((line, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="text-gray-500 select-none">&gt;</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Installed Tools */}
          {activeTab === "tools" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Installed Runtimes & Dev Tools</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage active runtime versions across your system and local projects.
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter installed..."
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    className="bg-[#121622] border border-[#20273a] text-xs text-gray-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-48"
                  />
                </div>
              </div>

              <div className="border border-[#1e2333] rounded-xl overflow-hidden bg-[#121622]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#151926] text-gray-400 uppercase tracking-wider text-[11px] border-b border-[#1e2333]">
                    <tr>
                      <th className="px-4 py-3">Tool</th>
                      <th className="px-4 py-3">Active Version</th>
                      <th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2131]">
                    {Object.entries(tools)
                      .filter(([name]) => name.toLowerCase().includes(toolSearch.toLowerCase()))
                      .map(([name, versions]) => {
                        const activeVer = versions.find((v) => v.active) || versions[0];
                        return (
                          <tr key={name} className="hover:bg-[#161c2a] transition-colors">
                            <td className="px-4 py-3 font-medium text-white flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="capitalize">{name}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-indigo-300 font-medium">
                              {activeVer?.version || "None"}
                            </td>
                            <td className="px-4 py-3 text-gray-400 font-mono">
                              {activeVer?.requested_version || "latest"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Installed
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => openVersionSwitcher(name)}
                                className="px-2.5 py-1 bg-[#1a2133] hover:bg-[#252f47] text-gray-200 rounded text-[11px] font-medium transition-colors border border-[#273147]"
                              >
                                Switch Version
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Env & PATH Inspector */}
          {activeTab === "env" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-lg font-semibold text-white">Environment & PATH Inspector</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Inspect the exact environment variables injected by mise and verify binary resolution order.
                </p>
              </div>

              {/* PATH Diagnostics */}
              {pathDiag && (
                <div className="bg-[#121622] border border-[#20273a] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs text-gray-300 uppercase tracking-wider">
                      PATH Resolution Order
                    </h3>
                    {pathDiag.conflicts.length === 0 ? (
                      <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>No Shadowing Conflicts</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>PATH Shadowing Warning</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {pathDiag.path_entries.slice(0, 7).map((entry, idx) => {
                      const isMise = entry.includes("mise");
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg font-mono ${
                            isMise
                              ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                              : "bg-[#0b0e15] border border-[#1a2030] text-gray-400"
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-gray-500 w-4 text-right">{idx + 1}.</span>
                            <span className="truncate">{entry}</span>
                          </div>
                          {isMise && (
                            <span className="text-[10px] text-indigo-400 uppercase font-semibold shrink-0 ml-2">
                              Mise Managed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Environment Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-gray-300 uppercase tracking-wider">
                    Resolved Environment Variables ({Object.keys(envVars).length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Filter env key..."
                    value={envSearch}
                    onChange={(e) => setEnvSearch(e.target.value)}
                    className="bg-[#121622] border border-[#20273a] text-xs text-gray-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-48"
                  />
                </div>

                <div className="border border-[#1e2333] rounded-xl overflow-hidden bg-[#121622]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151926] text-gray-400 uppercase tracking-wider text-[11px] border-b border-[#1e2333]">
                      <tr>
                        <th className="px-4 py-2.5 w-1/3">Variable Name</th>
                        <th className="px-4 py-2.5">Resolved Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2131] font-mono">
                      {Object.entries(envVars)
                        .filter(([k]) => k.toLowerCase().includes(envSearch.toLowerCase()))
                        .map(([key, val]) => (
                          <tr key={key} className="hover:bg-[#161c2a]">
                            <td className="px-4 py-2 text-indigo-300 font-medium">{key}</td>
                            <td className="px-4 py-2 text-gray-300 truncate max-w-lg">{val}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Registry Catalog */}
          {activeTab === "registry" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-lg font-semibold text-white">Tool Registry Catalog</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Discover and install runtimes, packages, and CLI tools from Aqua, core, and asdf repositories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registryTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="bg-[#121622] border border-[#20273a] rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white capitalize text-sm">{tool.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2538] text-gray-400">
                          {tool.backend}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono truncate">{tool.full_name}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1b2131] flex justify-end">
                      <button
                        onClick={async () => {
                          const res = await api.installTool(tool.name, "latest", workspace === "global" ? undefined : "/home/daniel/dev/mise-gui");
                          setStatusMessage(res);
                          logMessage(res);
                          setTimeout(() => setStatusMessage(null), 4000);
                          loadData();
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors shadow-sm shadow-indigo-600/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Install</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Visual Config TOML Editor */}
          {activeTab === "config" && (
            <div className="space-y-4 max-w-5xl h-full flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-white">Interactive Config TOML Editor</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Inspect and edit your active mise configuration and local secrets directly.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveEditor}
                    disabled={savingConfig || !isEditorDirty}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Save className={`w-3.5 h-3.5 ${savingConfig ? "animate-spin" : ""}`} />
                    <span>{savingConfig ? "Saving..." : isEditorDirty ? "Save Changes *" : "Saved"}</span>
                  </button>
                </div>
              </div>

              {/* File Selector Tabs & Quick Snippets */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121622] border border-[#20273a] rounded-xl p-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-gray-400 font-medium mr-1">File:</span>
                  {configFiles.map((f, idx) => (
                    <button
                      key={f.path}
                      onClick={() => handleSelectConfigFile(idx)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedFileIdx === idx
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-[#181d2a] text-gray-300 hover:bg-[#202738]"
                      }`}
                    >
                      {f.file_type === "local_secret" && <Lock className="w-3 h-3 text-emerald-400" />}
                      <span className="font-mono text-[11px]">
                        {f.file_type === "global"
                          ? "Global (~/.config/mise/config.toml)"
                          : f.file_type === "local_secret"
                          ? ".mise.local.toml (Git Ignored)"
                          : ".mise.toml (Project)"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-500">Insert Snippet:</span>
                  <button
                    onClick={() => {
                      setEditorText((prev) => prev + `\n[env]\nNPM_CONFIG_REGISTRY = "https://artifactory.corp/api/npm/virtual"\n`);
                      setIsEditorDirty(true);
                    }}
                    className="px-2 py-1 bg-[#192030] hover:bg-[#222b40] text-gray-300 rounded text-[10px] font-mono transition-colors"
                  >
                    + NPM Artifactory
                  </button>
                  <button
                    onClick={() => {
                      setEditorText((prev) => prev + `\n[env]\nNODE_EXTRA_CA_CERTS = "/etc/ssl/certs/corp-ca.pem"\n`);
                      setIsEditorDirty(true);
                    }}
                    className="px-2 py-1 bg-[#192030] hover:bg-[#222b40] text-gray-300 rounded text-[10px] font-mono transition-colors"
                  >
                    + CA Bundle
                  </button>
                </div>
              </div>

              {/* Code Editor Container */}
              <div className="border border-[#20273a] rounded-xl overflow-hidden bg-[#0a0c12] flex flex-col flex-1 min-h-[380px] shadow-2xl">
                <div className="bg-[#10141e] border-b border-[#1b2131] px-4 py-2 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span>{configFiles[selectedFileIdx]?.path || "config.toml"}</span>
                  {isEditorDirty ? (
                    <span className="text-amber-400 font-semibold">• Modified (unsaved)</span>
                  ) : (
                    <span className="text-emerald-400">✓ Up to date</span>
                  )}
                </div>

                <div className="relative flex-1 flex">
                  <textarea
                    value={editorText}
                    onChange={(e) => {
                      setEditorText(e.target.value);
                      setIsEditorDirty(true);
                    }}
                    spellCheck={false}
                    className="w-full h-full bg-transparent text-gray-200 font-mono text-xs p-4 leading-relaxed resize-none focus:outline-none selection:bg-indigo-600/30"
                    placeholder="# Enter TOML configuration here..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Console Drawer */}
        {terminalOpen && (
          <div className="h-44 border-t border-[#1e2333] bg-[#090b10] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0e1219] border-b border-[#1b202d] text-xs font-medium text-gray-400">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execution Output & Diagnostics Stream</span>
              </div>
              <button
                onClick={() => setTerminalOpen(false)}
                className="hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-1">
              {terminalLogs.map((log, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-indigo-400 select-none">➜</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Switch Version Modal */}
      {switchingTool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121622] border border-[#232b40] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">
                Switch Version: <span className="text-indigo-400 capitalize">{switchingTool}</span>
              </h3>
              <button
                onClick={() => setSwitchingTool(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Select or type a version to activate in your {workspace} configuration.
            </p>

            {fetchingVersions ? (
              <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Fetching remote versions from mise registry...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-gray-400">Available Remote Versions</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-[#222a3d] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {remoteVersions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1d2334]">
              <button
                onClick={() => setSwitchingTool(null)}
                className="px-3 py-1.5 bg-[#171c28] hover:bg-[#202738] text-gray-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchVersion}
                disabled={loading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30"
              >
                Activate Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Preset Modal */}
      {customPresetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121622] border border-[#232b40] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Add Custom Registry Preset</h3>
              <button
                onClick={() => setCustomPresetModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Configure a company Artifactory, Nexus, or internal repository mirror.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 text-[11px] font-medium">Preset Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Artifactory (NPM)"
                  value={newPreset.name || ""}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-[11px] font-medium">Target Tool</label>
                  <select
                    value={newPreset.tool || "npm"}
                    onChange={(e) => setNewPreset({ ...newPreset, tool: e.target.value })}
                    className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="npm">npm / Node.js</option>
                    <option value="pip">pip / Python</option>
                    <option value="go">go (GOPROXY)</option>
                    <option value="cargo">cargo (crates.io mirror)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-[11px] font-medium">CA Bundle Path (Optional)</label>
                  <input
                    type="text"
                    placeholder="/etc/ssl/certs/corp-ca.pem"
                    value={newPreset.ca_cert_path || ""}
                    onChange={(e) => setNewPreset({ ...newPreset, ca_cert_path: e.target.value })}
                    className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-medium">Registry URL</label>
                <input
                  type="text"
                  placeholder="https://artifactory.corp.internal/artifactory/api/npm/npm-virtual"
                  value={newPreset.registry_url || ""}
                  onChange={(e) => setNewPreset({ ...newPreset, registry_url: e.target.value })}
                  className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>

              <div>
                <label className="text-gray-400 text-[11px] font-medium">Authentication Token / Bearer Key (Optional)</label>
                <input
                  type="password"
                  placeholder="Paste Artifactory bearer token..."
                  value={newPreset.token || ""}
                  onChange={(e) => setNewPreset({ ...newPreset, token: e.target.value })}
                  className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1d2334]">
              <button
                onClick={() => setCustomPresetModal(false)}
                className="px-3 py-1.5 bg-[#171c28] hover:bg-[#202738] text-gray-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomPreset}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30"
              >
                Save & Apply to .mise.local.toml
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
