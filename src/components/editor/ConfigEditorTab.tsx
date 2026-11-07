import { Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useMiseStore } from "../../store/useMiseStore";

export function ConfigEditorTab() {
	const { configFiles, saveConfig } = useMiseStore();
	const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
	const [editorText, setEditorText] = useState<string>("");
	const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
	const [saving, setSaving] = useState<boolean>(false);

	useEffect(() => {
		if (configFiles[selectedFileIdx]) {
			setEditorText(configFiles[selectedFileIdx].content);
			setIsEditorDirty(false);
		}
	}, [selectedFileIdx, configFiles]);

	const handleSelect = (idx: number) => {
		setSelectedFileIdx(idx);
	};

	const handleSave = async () => {
		const current = configFiles[selectedFileIdx];
		if (!current) return;
		setSaving(true);
		await saveConfig(current.path, editorText);
		setIsEditorDirty(false);
		setSaving(false);
	};

	return (
		<div className="space-y-4 max-w-5xl h-full flex flex-col">
			<div className="flex items-center justify-between shrink-0">
				<div>
					<h2 className="text-lg font-semibold text-white">
						Interactive Config TOML Editor
					</h2>
					<p className="text-xs text-gray-400 mt-0.5">
						Inspect and edit your active mise configuration and local secrets
						directly.
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<button
						onClick={handleSave}
						disabled={saving || !isEditorDirty}
						className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
					>
						<Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
						<span>
							{saving
								? "Saving..."
								: isEditorDirty
									? "Save Changes *"
									: "Saved"}
						</span>
					</button>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 bg-[#121622] border border-[#20273a] rounded-xl p-3 shrink-0">
				<div className="flex items-center space-x-2">
					<span className="text-[11px] text-gray-400 font-medium mr-1">
						File:
					</span>
					{configFiles.map((f, idx) => (
						<button
							key={f.path}
							onClick={() => handleSelect(idx)}
							className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
								selectedFileIdx === idx
									? "bg-indigo-600 text-white shadow-sm"
									: "bg-[#181d2a] text-gray-300 hover:bg-[#202738]"
							}`}
						>
							{f.file_type === "local_secret" && (
								<Lock className="w-3 h-3 text-emerald-400" />
							)}
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
							setEditorText(
								(prev) =>
									prev +
									`\n[env]\nNPM_CONFIG_REGISTRY = "https://artifactory.corp/api/npm/virtual"\n`,
							);
							setIsEditorDirty(true);
						}}
						className="px-2 py-1 bg-[#192030] hover:bg-[#222b40] text-gray-300 rounded text-[10px] font-mono transition-colors"
					>
						+ NPM Artifactory
					</button>
					<button
						onClick={() => {
							setEditorText(
								(prev) =>
									prev +
									`\n[env]\nNODE_EXTRA_CA_CERTS = "/etc/ssl/certs/corp-ca.pem"\n`,
							);
							setIsEditorDirty(true);
						}}
						className="px-2 py-1 bg-[#192030] hover:bg-[#222b40] text-gray-300 rounded text-[10px] font-mono transition-colors"
					>
						+ CA Bundle
					</button>
				</div>
			</div>

			<div className="border border-[#20273a] rounded-xl overflow-hidden bg-[#0a0c12] flex flex-col flex-1 min-h-[380px] shadow-2xl">
				<div className="bg-[#10141e] border-b border-[#1b2131] px-4 py-2 flex items-center justify-between text-[11px] text-gray-400 font-mono">
					<span>{configFiles[selectedFileIdx]?.path || "config.toml"}</span>
					{isEditorDirty ? (
						<span className="text-amber-400 font-semibold">
							• Modified (unsaved)
						</span>
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
	);
}
