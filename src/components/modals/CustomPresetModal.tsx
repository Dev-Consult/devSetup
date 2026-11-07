import { useState } from "react";
import type { RegistryPreset } from "../../services/api";
import { useMiseStore } from "../../store/useMiseStore";

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

export function CustomPresetModal({ isOpen, onClose }: Props) {
	const { applyPreset } = useMiseStore();
	const [newPreset, setNewPreset] = useState<Partial<RegistryPreset>>({
		name: "Internal Artifactory",
		tool: "npm",
		registry_url: "https://artifactory.corp.internal/api/npm/virtual",
		ca_cert_path: "/etc/ssl/certs/corp-ca.pem",
		is_local_secret: true,
	});

	if (!isOpen) return null;

	const handleSave = () => {
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
		applyPreset(created, newPreset.token);
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div className="bg-[#121622] border border-[#232b40] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-white text-sm">
						Add Custom Registry Preset
					</h3>
					<button
						onClick={onClose}
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
						<label className="text-gray-400 text-[11px] font-medium">
							Preset Display Name
						</label>
						<input
							type="text"
							placeholder="e.g. Acme Corp Artifactory (NPM)"
							value={newPreset.name || ""}
							onChange={(e) =>
								setNewPreset({ ...newPreset, name: e.target.value })
							}
							className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-gray-400 text-[11px] font-medium">
								Target Tool
							</label>
							<select
								value={newPreset.tool || "npm"}
								onChange={(e) =>
									setNewPreset({ ...newPreset, tool: e.target.value })
								}
								className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
							>
								<option value="npm">npm / Node.js</option>
								<option value="pip">pip / Python</option>
								<option value="go">go (GOPROXY)</option>
								<option value="cargo">cargo (crates.io mirror)</option>
							</select>
						</div>

						<div>
							<label className="text-gray-400 text-[11px] font-medium">
								CA Bundle Path (Optional)
							</label>
							<input
								type="text"
								placeholder="/etc/ssl/certs/corp-ca.pem"
								value={newPreset.ca_cert_path || ""}
								onChange={(e) =>
									setNewPreset({ ...newPreset, ca_cert_path: e.target.value })
								}
								className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
							/>
						</div>
					</div>

					<div>
						<label className="text-gray-400 text-[11px] font-medium">
							Registry URL
						</label>
						<input
							type="text"
							placeholder="https://artifactory.corp.internal/artifactory/api/npm/npm-virtual"
							value={newPreset.registry_url || ""}
							onChange={(e) =>
								setNewPreset({ ...newPreset, registry_url: e.target.value })
							}
							className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
						/>
					</div>

					<div>
						<label className="text-gray-400 text-[11px] font-medium">
							Authentication Token / Bearer Key (Optional)
						</label>
						<input
							type="password"
							placeholder="Paste Artifactory bearer token..."
							value={newPreset.token || ""}
							onChange={(e) =>
								setNewPreset({ ...newPreset, token: e.target.value })
							}
							className="mt-1 w-full bg-[#0a0c12] border border-[#1e2333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-[11px]"
						/>
					</div>
				</div>

				<div className="flex justify-end space-x-3 pt-3 border-t border-[#1d2334]">
					<button
						onClick={onClose}
						className="px-3 py-1.5 bg-[#171c28] hover:bg-[#202738] text-gray-300 rounded-lg text-xs font-medium"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30"
					>
						Save & Apply to .mise.local.toml
					</button>
				</div>
			</div>
		</div>
	);
}
