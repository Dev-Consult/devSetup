import {
	Activity,
	ChevronDown,
	ChevronUp,
	FileCode2,
	Globe,
	Layers,
	ShieldCheck,
	Terminal,
	Wrench,
} from "lucide-react";
import { type ActiveTab, useMiseStore } from "../../store/useMiseStore";

export function Sidebar() {
	const { activeTab, setActiveTab, tools, terminalOpen, setTerminalOpen } =
		useMiseStore();

	const navItems: { id: ActiveTab; label: string; icon: typeof ShieldCheck }[] =
		[
			{
				id: "enterprise",
				label: "Enterprise & Artifactory",
				icon: ShieldCheck,
			},
			{ id: "diagnostics", label: "Multi-Tier Diagnostics", icon: Activity },
			{ id: "tools", label: "Installed Tools", icon: Layers },
			{ id: "env", label: "Env & PATH Inspector", icon: Terminal },
			{ id: "registry", label: "Tool Catalog", icon: Globe },
			{ id: "config", label: "Config TOML Editor", icon: FileCode2 },
		];

	return (
		<aside className="w-64 border-r border-[#1e2333] bg-[#0f121b] flex flex-col justify-between p-4 shrink-0">
			<div>
				<div className="flex items-center space-x-3 px-2 py-3 mb-6">
					<div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shadow-md shadow-indigo-600/20">
						<Wrench className="w-5 h-5 text-indigo-400" />
					</div>
					<div>
						<h1 className="font-semibold text-white tracking-wide text-sm">
							Mise Desktop
						</h1>
						<p className="text-[11px] text-gray-400">Dev Tools & Env Control</p>
					</div>
				</div>

				<nav className="space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = activeTab === item.id;
						return (
							<button
								key={item.id}
								onClick={() => setActiveTab(item.id)}
								className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
									isActive
										? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
										: "text-gray-400 hover:text-gray-200 hover:bg-[#181d2a]"
								}`}
							>
								<Icon className="w-4 h-4" />
								<span>{item.label}</span>
							</button>
						);
					})}
				</nav>
			</div>

			<div className="space-y-3">
				<button
					onClick={() => setTerminalOpen(!terminalOpen)}
					className="w-full flex items-center justify-between px-3 py-2 bg-[#151924] hover:bg-[#1c2231] border border-[#23293d] rounded-lg text-xs text-gray-300 transition-colors"
				>
					<div className="flex items-center space-x-2">
						<Terminal className="w-3.5 h-3.5 text-indigo-400" />
						<span>Console Logs</span>
					</div>
					{terminalOpen ? (
						<ChevronDown className="w-3.5 h-3.5" />
					) : (
						<ChevronUp className="w-3.5 h-3.5" />
					)}
				</button>

				<div className="bg-[#151924] border border-[#23293d] rounded-xl p-3">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-[11px] font-medium text-gray-400">
							Mise Engine
						</span>
						<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
							Active
						</span>
					</div>
					<div className="text-[11px] text-gray-400">
						{Object.keys(tools).length} runtimes managed
					</div>
				</div>
			</div>
		</aside>
	);
}
