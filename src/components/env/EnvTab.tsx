import {
	AlertTriangle,
	CheckCircle2,
	KeyRound,
	Plus,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useMiseStore } from "../../store/useMiseStore";

export function EnvTab() {
	const { pathDiag, envVars, envAudit, populateMissingEnv, loading } =
		useMiseStore();
	const [envSearch, setEnvSearch] = useState<string>("");

	return (
		<div className="space-y-6 max-w-5xl">
			<div>
				<h2 className="text-lg font-semibold text-white">
					Environment & PATH Inspector
				</h2>
				<p className="text-xs text-gray-400 mt-1">
					Inspect the exact environment variables injected by mise, audit
					template compliance, and verify binary resolution order.
				</p>
			</div>

			{/* .env.example Template Audit Card */}
			{envAudit?.example_file_found && (
				<div
					className={`border rounded-xl p-5 space-y-4 ${
						envAudit.missing_count > 0
							? "bg-amber-500/5 border-amber-500/20"
							: "bg-emerald-500/5 border-emerald-500/20"
					}`}
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center space-x-2.5">
							<div
								className={`p-2 rounded-lg ${
									envAudit.missing_count > 0
										? "bg-amber-500/20 text-amber-400"
										: "bg-emerald-500/20 text-emerald-400"
								}`}
							>
								{envAudit.missing_count > 0 ? (
									<AlertTriangle className="w-4 h-4" />
								) : (
									<ShieldCheck className="w-4 h-4" />
								)}
							</div>
							<div>
								<h3 className="text-xs font-semibold uppercase tracking-wider text-gray-200 flex items-center space-x-2">
									<span>.env.example Template Audit</span>
									<span
										className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
											envAudit.missing_count > 0
												? "bg-amber-500/20 text-amber-300"
												: "bg-emerald-500/20 text-emerald-300"
										}`}
									>
										{envAudit.missing_count > 0
											? `${envAudit.missing_count} Missing`
											: "Fully Compliant"}
									</span>
								</h3>
								<p className="text-[11px] text-gray-400 mt-0.5">
									Template:{" "}
									<code className="text-indigo-300 font-mono">
										{envAudit.example_file_path}
									</code>
								</p>
							</div>
						</div>

						{envAudit.missing_count > 0 && (
							<button
								onClick={() => populateMissingEnv()}
								disabled={loading}
								className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all shadow-md shadow-amber-600/30 shrink-0"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Populate to .mise.local.toml</span>
							</button>
						)}
					</div>

					{envAudit.missing_count > 0 ? (
						<div className="space-y-2 pt-2 border-t border-[#232b3d]">
							<p className="text-xs text-gray-400">
								The following variables were declared in{" "}
								<code className="text-gray-300">.env.example</code> but are
								unassigned in your active mise environment:
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
								{envAudit.items
									.filter((item) => !item.is_set || item.is_empty)
									.map((item) => (
										<div
											key={item.key}
											className="bg-[#0e111a] border border-amber-500/30 rounded-lg p-2.5 flex flex-col justify-between"
										>
											<div className="flex items-center space-x-1.5 text-xs font-mono text-amber-300 font-semibold truncate">
												<KeyRound className="w-3.5 h-3.5 shrink-0 text-amber-400" />
												<span className="truncate">{item.key}</span>
											</div>
											{item.default_value && (
												<span className="text-[10px] text-gray-500 font-mono truncate mt-1">
													default: {item.default_value}
												</span>
											)}
										</div>
									))}
							</div>
						</div>
					) : (
						<p className="text-xs text-emerald-400/90 flex items-center space-x-1.5">
							<CheckCircle2 className="w-3.5 h-3.5" />
							<span>
								All required variables from .env.example are satisfied in your
								active scope.
							</span>
						</p>
					)}
				</div>
			)}

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
