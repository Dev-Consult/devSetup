import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useMiseStore } from "../../store/useMiseStore";

interface Props {
	tool: string | null;
	onClose: () => void;
}

export function VersionSwitcherModal({ tool, onClose }: Props) {
	const { workspace, installTool } = useMiseStore();
	const [remoteVersions, setRemoteVersions] = useState<string[]>([]);
	const [selectedVersion, setSelectedVersion] = useState<string>("latest");
	const [loading, setLoading] = useState<boolean>(false);
	const [submitting, setSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (!tool) return;
		setLoading(true);
		api
			.getRemoteVersions(tool)
			.then((versions) => {
				setRemoteVersions(versions);
				setSelectedVersion(versions[0] || "latest");
			})
			.catch((err) => {
				console.error(err);
				setRemoteVersions(["latest"]);
			})
			.finally(() => setLoading(false));
	}, [tool]);

	if (!tool) return null;

	const handleSwitch = async () => {
		setSubmitting(true);
		await installTool(tool, selectedVersion);
		setSubmitting(false);
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
			<div className="bg-[#121622] border border-[#232b40] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-white text-sm">
						Switch Version:{" "}
						<span className="text-indigo-400 capitalize">{tool}</span>
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200"
					>
						✕
					</button>
				</div>

				<p className="text-xs text-gray-400">
					Select or type a version to activate in your {workspace}{" "}
					configuration.
				</p>

				{loading ? (
					<div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
						<RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
						<span>Fetching remote versions from mise registry...</span>
					</div>
				) : (
					<div className="space-y-3">
						<label className="text-[11px] font-medium text-gray-400">
							Available Remote Versions
						</label>
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
						onClick={onClose}
						className="px-3 py-1.5 bg-[#171c28] hover:bg-[#202738] text-gray-300 rounded-lg text-xs font-medium"
					>
						Cancel
					</button>
					<button
						onClick={handleSwitch}
						disabled={submitting}
						className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30 disabled:opacity-50"
					>
						{submitting ? "Activating..." : "Activate Version"}
					</button>
				</div>
			</div>
		</div>
	);
}
