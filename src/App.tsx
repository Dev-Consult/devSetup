import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { DiagnosticsTab } from "./components/diagnostics/DiagnosticsTab";
import { ConfigEditorTab } from "./components/editor/ConfigEditorTab";
import { EnterpriseTab } from "./components/enterprise/EnterpriseTab";
import { EnvTab } from "./components/env/EnvTab";
import { ConsoleDrawer } from "./components/layout/ConsoleDrawer";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { CustomPresetModal } from "./components/modals/CustomPresetModal";
import { VersionSwitcherModal } from "./components/modals/VersionSwitcherModal";
import { RegistryTab } from "./components/registry/RegistryTab";
import { ToolsTab } from "./components/tools/ToolsTab";
import { useMiseStore } from "./store/useMiseStore";
import "./App.css";

export default function App() {
	const {
		activeTab,
		workspace,
		statusMessage,
		syncStatus,
		syncProject,
		loading,
		loadData,
	} = useMiseStore();

	const [switchingTool, setSwitchingTool] = useState<string | null>(null);
	const [customPresetModal, setCustomPresetModal] = useState<boolean>(false);

	useEffect(() => {
		loadData();
	}, [loadData]);

	return (
		<div className="flex h-screen w-screen overflow-hidden bg-[#0c0e14] text-gray-200">
			<Sidebar />

			<main className="flex-1 flex flex-col h-full overflow-hidden">
				<Header />

				{statusMessage && (
					<div className="bg-indigo-600/20 border-b border-indigo-500/40 px-6 py-2 flex items-center space-x-2 text-xs text-indigo-200">
						<CheckCircle2 className="w-4 h-4 text-indigo-400" />
						<span>{statusMessage}</span>
					</div>
				)}

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
									onClick={syncProject}
									disabled={loading}
									className="w-full md:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
								>
									<Zap
										className={`w-4 h-4 text-amber-300 ${loading ? "animate-spin" : ""}`}
									/>
									<span>
										{loading ? "Syncing Tools..." : "1-Click Sync Project"}
									</span>
								</button>
							</div>
						</div>
					)}

					{syncStatus?.is_in_sync && workspace === "project" && (
						<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
							<div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
								<CheckCircle2 className="w-4 h-4 text-emerald-400" />
								<span>
									Workspace is fully synchronized with{" "}
									{syncStatus.config_file_path || ".mise.toml"}.
								</span>
							</div>
							<span className="text-emerald-400 text-[11px] font-mono">
								All Runtimes Ready
							</span>
						</div>
					)}

					{/* Active Tab View */}
					{activeTab === "enterprise" && (
						<EnterpriseTab
							onOpenCustomModal={() => setCustomPresetModal(true)}
						/>
					)}
					{activeTab === "diagnostics" && <DiagnosticsTab />}
					{activeTab === "tools" && (
						<ToolsTab onOpenSwitcher={(tool) => setSwitchingTool(tool)} />
					)}
					{activeTab === "env" && <EnvTab />}
					{activeTab === "registry" && (
						<RegistryTab onOpenSwitcher={(tool) => setSwitchingTool(tool)} />
					)}
					{activeTab === "config" && <ConfigEditorTab />}
				</div>

				<ConsoleDrawer />
			</main>

			<VersionSwitcherModal
				tool={switchingTool}
				onClose={() => setSwitchingTool(null)}
			/>

			<CustomPresetModal
				isOpen={customPresetModal}
				onClose={() => setCustomPresetModal(false)}
			/>
		</div>
	);
}
