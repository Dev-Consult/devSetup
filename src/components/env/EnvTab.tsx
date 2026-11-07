import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useMiseStore } from "../../store/useMiseStore";

export function EnvTab() {
	const { pathDiag, envVars } = useMiseStore();
	const [envSearch, setEnvSearch] = useState<string>("");

	return (
		<div className="space-y-6 max-w-5xl">
			<div>
				<h2 className="text-lg font-semibold text-white">
					Environment & PATH Inspector
				</h2>
				<p className="text-xs text-gray-400 mt-1">
					Inspect the exact environment variables injected by mise and verify
					binary resolution order.
				</p>
			</div>

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
										<span className="text-gray-500 w-4 text-right">
											{idx + 1}.
										</span>
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
								.filter(([k]) =>
									k.toLowerCase().includes(envSearch.toLowerCase()),
								)
								.map(([key, val]) => (
									<tr key={key} className="hover:bg-[#161c2a]">
										<td className="px-4 py-2 text-indigo-300 font-medium">
											{key}
										</td>
										<td className="px-4 py-2 text-gray-300 truncate max-w-lg">
											{val}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
