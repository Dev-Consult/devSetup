import { Eye, EyeOff, KeyRound, Lock, Plus } from "lucide-react";
import { useState } from "react";
import type { RegistryPreset } from "../../services/api";
import { useMiseStore } from "../../store/useMiseStore";

interface Props {
	onOpenCustomModal: () => void;
}

export function EnterpriseTab({ onOpenCustomModal }: Props) {
	const { presets, workspace, applyPreset } = useMiseStore();
	const [revealedSecrets, setRevealedSecrets] = useState<
		Record<string, boolean>
	>({});
	const [editingToken, setEditingToken] = useState<Record<string, string>>({});

	const toggleReveal = (key: string) => {
		setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleApply = (preset: RegistryPreset) => {
		const token = editingToken[preset.id];
		applyPreset(preset, token);
	};

	return (
		<div className="space-y-6 max-w-5xl">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-white">
						Enterprise Registry Presets
					</h2>
					<p className="text-xs text-gray-400 mt-1">
						Repoint your package managers (
						<span className="text-indigo-400 font-mono">npm</span>,{" "}
						<span className="text-indigo-400 font-mono">pip</span>,{" "}
						<span className="text-indigo-400 font-mono">go</span>) to JFrog
						Artifactory or internal mirrors.
					</p>
				</div>
				<button
					onClick={onOpenCustomModal}
					className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
				>
					<Plus className="w-3.5 h-3.5" />
					<span>Add Custom Registry</span>
				</button>
			</div>

			<div className="flex items-start space-x-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
				<Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
				<div>
					<h4 className="text-xs font-semibold text-emerald-300">
						Safe Token Isolation
					</h4>
					<p className="text-xs text-emerald-200/80 mt-0.5">
						Credentials entered below are automatically saved to{" "}
						<code className="bg-emerald-950/60 px-1 py-0.5 rounded text-emerald-300">
							.mise.local.toml
						</code>
						. This file is automatically ignored by Git, ensuring corporate
						tokens are never leaked to version control.
					</p>
				</div>
			</div>

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
								<h3 className="font-medium text-sm text-white">
									{preset.name}
								</h3>
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
								<label className="text-gray-400 text-[11px] font-medium">
									Registry URL
								</label>
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
											setEditingToken({
												...editingToken,
												[preset.id]: e.target.value,
											})
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
								<span>
									Corporate CA Bundle:{" "}
									<code className="text-gray-300 font-mono">
										{preset.ca_cert_path}
									</code>
								</span>
								<span className="text-[10px] text-indigo-400">
									Configures NODE_EXTRA_CA_CERTS
								</span>
							</div>
						)}

						<div className="flex justify-end pt-2 border-t border-[#1d2334]">
							<button
								onClick={() => handleApply(preset)}
								className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
							>
								Apply to{" "}
								{workspace === "global" ? "~/.config/mise" : ".mise.local.toml"}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
