import { FolderGit2, RefreshCw } from "lucide-react";
import { useMiseStore } from "../../store/useMiseStore";

export function Header() {
	const { workspace, setWorkspace, loading, loadData } = useMiseStore();

	return (
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
					className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#171c29] hover:bg-[#20273a] text-gray-300 border border-[#262e45] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
				>
					<RefreshCw
						className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
					/>
					<span>Refresh</span>
				</button>
			</div>
		</header>
	);
}
