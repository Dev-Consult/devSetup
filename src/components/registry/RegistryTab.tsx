import { Plus } from "lucide-react";
import { useMiseStore } from "../../store/useMiseStore";

export function RegistryTab() {
	const { registryTools, installTool } = useMiseStore();

	return (
		<div className="space-y-6 max-w-5xl">
			<div>
				<h2 className="text-lg font-semibold text-white">
					Tool Registry Catalog
				</h2>
				<p className="text-xs text-gray-400 mt-1">
					Discover and install runtimes, packages, and CLI tools from Aqua,
					core, and asdf repositories.
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
								<h3 className="font-semibold text-white capitalize text-sm">
									{tool.name}
								</h3>
								<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2538] text-gray-400">
									{tool.backend}
								</span>
							</div>
							<p className="text-xs text-gray-400 font-mono truncate">
								{tool.full_name}
							</p>
						</div>

						<div className="mt-4 pt-3 border-t border-[#1b2131] flex justify-end">
							<button
								onClick={() => installTool(tool.name, "latest")}
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
	);
}
