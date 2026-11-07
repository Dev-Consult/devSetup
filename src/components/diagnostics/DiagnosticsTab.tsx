import { AlertTriangle, CheckCircle2, Play, XCircle } from "lucide-react";
import { useMiseStore } from "../../store/useMiseStore";

export function DiagnosticsTab() {
	const {
		diagTool,
		setDiagTool,
		diagRunning,
		diagnosticReport,
		runDiagnostic,
		setActiveTab,
	} = useMiseStore();

	return (
		<div className="space-y-6 max-w-4xl">
			<div>
				<h2 className="text-lg font-semibold text-white">
					Multi-Tier Environment Diagnostics
				</h2>
				<p className="text-xs text-gray-400 mt-1">
					Diagnose why package installations fail: inspects environment
					variables, probes TCP/TLS reachability to Artifactory, and runs live
					CLI checks.
				</p>
			</div>

			<div className="bg-[#121622] border border-[#20273a] rounded-xl p-4 flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<span className="text-xs text-gray-400 font-medium">
						Select Tool to Test:
					</span>
					<select
						value={diagTool}
						onChange={(e) => setDiagTool(e.target.value)}
						className="bg-[#0a0c12] border border-[#222a3d] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
					>
						<option value="npm">npm / Node.js</option>
						<option value="pip">pip / Python</option>
						<option value="go">go (GOPROXY)</option>
					</select>
				</div>

				<button
					onClick={runDiagnostic}
					disabled={diagRunning}
					className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
				>
					<Play
						className={`w-3.5 h-3.5 ${diagRunning ? "animate-spin" : ""}`}
					/>
					<span>{diagRunning ? "Probing..." : "Run Diagnostic Probe"}</span>
				</button>
			</div>

			{diagnosticReport && (
				<div className="space-y-4">
					<div
						className={`rounded-xl p-4 border flex items-start space-x-3 ${
							diagnosticReport.cli_ping_success
								? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
								: "bg-red-500/10 border-red-500/30 text-red-300"
						}`}
					>
						{diagnosticReport.cli_ping_success ? (
							<CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
						) : (
							<XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
						)}
						<div className="flex-1">
							<h3 className="font-semibold text-sm">
								{diagnosticReport.cli_ping_success
									? "Diagnostic Passed"
									: "Issue Detected"}
							</h3>
							<p className="text-xs mt-1 text-gray-300">
								{diagnosticReport.status_message}
							</p>
							{diagnosticReport.suggested_fix && (
								<div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-yellow-300 flex items-start justify-between space-x-3">
									<div className="flex items-start space-x-2">
										<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
										<span>
											<strong>Recommended Fix:</strong>{" "}
											{diagnosticReport.suggested_fix}
										</span>
									</div>
									<button
										onClick={() => setActiveTab("enterprise")}
										className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 rounded text-[11px] font-semibold shrink-0 transition-colors"
									>
										Configure in Presets →
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="bg-[#121622] border border-[#20273a] rounded-xl p-5 space-y-4">
						<h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
							Diagnostic Execution Steps
						</h4>

						<div className="space-y-3">
							<div className="flex items-center justify-between text-xs border-b border-[#1c2233] pb-2.5">
								<div className="flex items-center space-x-2">
									<CheckCircle2 className="w-4 h-4 text-emerald-400" />
									<span className="font-medium text-gray-200">
										Tier 1: Static Environment & Config Audit
									</span>
								</div>
								<span className="text-[11px] text-gray-400 font-mono">
									{diagnosticReport.static_env_ok
										? "Variables Validated"
										: "Missing Vars"}
								</span>
							</div>

							<div className="flex items-center justify-between text-xs border-b border-[#1c2233] pb-2.5">
								<div className="flex items-center space-x-2">
									{diagnosticReport.network_reachable ? (
										<CheckCircle2 className="w-4 h-4 text-emerald-400" />
									) : (
										<XCircle className="w-4 h-4 text-red-400" />
									)}
									<span className="font-medium text-gray-200">
										Tier 2: Network & TLS Reachability Probe
									</span>
								</div>
								<span className="text-[11px] text-gray-400 font-mono">
									{diagnosticReport.network_reachable
										? "Port 443 Handshake OK"
										: "Unreachable"}
								</span>
							</div>

							<div className="flex items-center justify-between text-xs">
								<div className="flex items-center space-x-2">
									{diagnosticReport.cli_ping_success ? (
										<CheckCircle2 className="w-4 h-4 text-emerald-400" />
									) : (
										<XCircle className="w-4 h-4 text-red-400" />
									)}
									<span className="font-medium text-gray-200">
										Tier 3: Contextual Runtime Ping (`mise exec -- {diagTool}{" "}
										ping`)
									</span>
								</div>
								<span className="text-[11px] text-gray-400 font-mono">
									{diagnosticReport.cli_ping_success
										? "Exit Code 0"
										: `Exit Code ${diagnosticReport.exit_code ?? 1}`}
								</span>
							</div>
						</div>

						<div className="mt-4 bg-[#0a0c12] border border-[#1b2030] rounded-lg p-3 font-mono text-[11px] text-gray-300 space-y-1">
							{diagnosticReport.details.map((line, idx) => (
								<div key={idx} className="flex items-start space-x-2">
									<span className="text-gray-500 select-none">&gt;</span>
									<span>{line}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
