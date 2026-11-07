import { Search } from "lucide-react";
import { useState } from "react";
import { useMiseStore } from "../../store/useMiseStore";

interface Props {
	onOpenSwitcher: (tool: string) => void;
}

export function ToolsTab({ onOpenSwitcher }: Props) {
	const { tools } = useMiseStore();
	const [toolSearch, setToolSearch] = useState<string>("");

	return (
		<div className="space-y-6 max-w-5xl">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-white">
						Installed Runtimes & Dev Tools
					</h2>
					<p className="text-xs text-gray-400 mt-1">
						Manage active runtime versions across your system and local
						projects.
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
							.filter(([name]) =>
								name.toLowerCase().includes(toolSearch.toLowerCase()),
							)
							.map(([name, versions]) => {
								const activeVer = versions.find((v) => v.active) || versions[0];
								return (
									<tr
										key={name}
										className="hover:bg-[#161c2a] transition-colors"
									>
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
												onClick={() => onOpenSwitcher(name)}
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
	);
}
