import { Terminal } from "lucide-react";
import { useMiseStore } from "../../store/useMiseStore";

export function ConsoleDrawer() {
	const { terminalOpen, setTerminalOpen, terminalLogs } = useMiseStore();

	if (!terminalOpen) return null;

	return (
		<div className="h-44 border-t border-[#1e2333] bg-[#090b10] flex flex-col shrink-0">
			<div className="flex items-center justify-between px-4 py-2 bg-[#0e1219] border-b border-[#1b202d] text-xs font-medium text-gray-400">
				<div className="flex items-center space-x-2">
					<Terminal className="w-3.5 h-3.5 text-indigo-400" />
					<span>Execution Output & Diagnostics Stream</span>
				</div>
				<button
					onClick={() => setTerminalOpen(false)}
					className="hover:text-gray-200 transition-colors"
				>
					✕
				</button>
			</div>
			<div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-1">
				{terminalLogs.map((log, i) => (
					<div key={i} className="flex items-start space-x-2">
						<span className="text-indigo-400 select-none">➜</span>
						<span>{log}</span>
					</div>
				))}
			</div>
		</div>
	);
}
