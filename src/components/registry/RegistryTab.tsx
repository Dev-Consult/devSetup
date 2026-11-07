import { Check, Download, Flame, Layers, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMiseStore } from "../../store/useMiseStore";

interface Props {
	onOpenSwitcher: (tool: string) => void;
}

const PAGE_SIZE = 24;

export function RegistryTab({ onOpenSwitcher }: Props) {
	const { registryTools, tools } = useMiseStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		"all" | "core" | "aqua" | "asdf" | "installed"
	>("all");
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [prevFilterKey, setPrevFilterKey] = useState("all:");

	const sentinelRef = useRef<HTMLDivElement | null>(null);

	// Featured developer essentials
	const featuredTools = [
		{
			name: "node",
			category: "Runtime",
			desc: "JavaScript / TypeScript runtime",
		},
		{
			name: "python",
			category: "Language",
			desc: "Python runtime & package ecosystem",
		},
		{ name: "go", category: "Language", desc: "Go compiler and toolchain" },
		{
			name: "rust",
			category: "Toolchain",
			desc: "Rust compiler (cargo & rustc)",
		},
		{
			name: "bun",
			category: "Runtime",
			desc: "Ultra-fast JS runtime & package manager",
		},
		{
			name: "kubectl",
			category: "DevOps",
			desc: "Kubernetes cluster CLI control",
		},
		{
			name: "terraform",
			category: "Cloud",
			desc: "Infrastructure as Code tool",
		},
		{
			name: "uv",
			category: "Python",
			desc: "10-100x faster pip & venv manager",
		},
	];

	// Filtered tools
	const filteredTools = useMemo(() => {
		return registryTools.filter((t) => {
			const matchesSearch =
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false);

			const isInstalled = !!tools[t.name];

			if (!matchesSearch) return false;

			if (selectedCategory === "all") return true;
			if (selectedCategory === "installed") return isInstalled;
			if (selectedCategory === "core") return t.backend === "core";
			if (selectedCategory === "aqua") return t.backend === "aqua";
			if (selectedCategory === "asdf") return t.backend.includes("asdf");
			return true;
		});
	}, [registryTools, tools, searchQuery, selectedCategory]);

	// Reset pagination on search or category change during render (standard React pattern)
	const currentFilterKey = `${selectedCategory}:${searchQuery}`;
	if (prevFilterKey !== currentFilterKey) {
		setPrevFilterKey(currentFilterKey);
		setVisibleCount(PAGE_SIZE);
	}

	// Incremental scroll loader (Infinite Scroll via IntersectionObserver)
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setVisibleCount((prev) =>
						Math.min(prev + PAGE_SIZE, filteredTools.length),
					);
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [filteredTools.length]);

	const displayedTools = useMemo(() => {
		return filteredTools.slice(0, visibleCount);
	}, [filteredTools, visibleCount]);

	const getBackendColor = (backend: string) => {
		switch (backend) {
			case "core":
				return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
			case "aqua":
				return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
			case "cargo":
				return "bg-amber-500/20 text-amber-400 border-amber-500/30";
			case "github":
				return "bg-purple-500/20 text-purple-400 border-purple-500/30";
			default:
				return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
		}
	};

	return (
		<div className="space-y-6 max-w-5xl">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-white flex items-center space-x-2">
						<span>Tool Inventory & Catalog</span>
						<span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
							{registryTools.length} Available
						</span>
					</h2>
					<p className="text-xs text-gray-400 mt-0.5">
						Explore, search, and install developer tools, language runtimes, and
						DevOps utilities.
					</p>
				</div>

				{/* Search Input */}
				<div className="relative w-full md:w-72">
					<Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
					<input
						type="text"
						placeholder="Search 900+ tools (e.g. docker, go, uv)..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full bg-[#121622] border border-[#20273a] text-xs text-gray-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-all font-medium"
					/>
				</div>
			</div>

			{/* Spotlight / Popular Developer Essentials */}
			{searchQuery === "" && selectedCategory === "all" && (
				<div className="space-y-2.5">
					<div className="flex items-center space-x-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
						<Flame className="w-3.5 h-3.5 text-amber-400" />
						<span>Popular Developer Essentials</span>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{featuredTools.map((feat) => {
							const installedInfo = tools[feat.name];
							const isInstalled = !!installedInfo;
							const activeVer =
								installedInfo?.find((v) => v.active) || installedInfo?.[0];

							return (
								<div
									key={feat.name}
									className="bg-gradient-to-br from-[#131724] to-[#0e111a] border border-[#20273a] hover:border-indigo-500/40 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-md"
								>
									<div>
										<div className="flex items-center justify-between mb-1">
											<h4 className="font-semibold text-white capitalize text-sm group-hover:text-indigo-300 transition-colors">
												{feat.name}
											</h4>
											<span className="text-[10px] font-mono text-gray-400 bg-[#1a2133] px-1.5 py-0.5 rounded">
												{feat.category}
											</span>
										</div>
										<p className="text-[11px] text-gray-400 line-clamp-2 leading-tight">
											{feat.desc}
										</p>
									</div>

									<div className="mt-3 pt-2.5 border-t border-[#1a2030] flex items-center justify-between">
										{isInstalled ? (
											<span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
												<Check className="w-3 h-3" />
												<span>v{activeVer?.version || "active"}</span>
											</span>
										) : (
											<span className="text-[10px] text-gray-500">
												Not Installed
											</span>
										)}

										<button
											onClick={() => onOpenSwitcher(feat.name)}
											className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
												isInstalled
													? "bg-[#181f2f] hover:bg-[#222b40] text-gray-300 border border-[#28324a]"
													: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
											}`}
										>
											{isInstalled ? "Switch" : "Install"}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Category Filter Pills */}
			<div className="flex items-center space-x-2 border-b border-[#1c2233] pb-3 overflow-x-auto text-xs">
				<button
					onClick={() => setSelectedCategory("all")}
					className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 shrink-0 ${
						selectedCategory === "all"
							? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
							: "bg-[#141824] text-gray-400 hover:text-gray-200"
					}`}
				>
					<Layers className="w-3.5 h-3.5" />
					<span>All Tools ({registryTools.length})</span>
				</button>

				<button
					onClick={() => setSelectedCategory("core")}
					className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
						selectedCategory === "core"
							? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
							: "bg-[#141824] text-gray-400 hover:text-gray-200"
					}`}
				>
					Core Runtimes
				</button>

				<button
					onClick={() => setSelectedCategory("aqua")}
					className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
						selectedCategory === "aqua"
							? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
							: "bg-[#141824] text-gray-400 hover:text-gray-200"
					}`}
				>
					Aqua Binaries
				</button>

				<button
					onClick={() => setSelectedCategory("asdf")}
					className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
						selectedCategory === "asdf"
							? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
							: "bg-[#141824] text-gray-400 hover:text-gray-200"
					}`}
				>
					ASDF Plugins
				</button>

				<button
					onClick={() => setSelectedCategory("installed")}
					className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center space-x-1.5 ${
						selectedCategory === "installed"
							? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
							: "bg-[#141824] text-gray-400 hover:text-gray-200"
					}`}
				>
					<Check className="w-3.5 h-3.5 text-emerald-400" />
					<span>Installed on Machine ({Object.keys(tools).length})</span>
				</button>
			</div>

			{/* Status Bar: Showing X of Y */}
			<div className="flex items-center justify-between text-xs text-gray-400 px-1">
				<span>
					Showing{" "}
					<strong className="text-gray-200">{displayedTools.length}</strong> of{" "}
					<strong className="text-gray-200">{filteredTools.length}</strong>{" "}
					matches
				</span>
				{visibleCount < filteredTools.length && (
					<span className="text-[11px] text-gray-500">
						Scroll down to load more automatically
					</span>
				)}
			</div>

			{/* Main Grid of Filtered Tools */}
			{filteredTools.length === 0 ? (
				<div className="py-12 text-center bg-[#10131d] border border-[#1e2333] rounded-2xl p-8 space-y-2">
					<Search className="w-8 h-8 text-gray-500 mx-auto" />
					<h3 className="text-sm font-semibold text-gray-300">
						No tools found matching "{searchQuery}"
					</h3>
					<p className="text-xs text-gray-500">
						Try searching by tool name, runtime keyword, or category.
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
						{displayedTools.map((tool) => {
							const installedInfo = tools[tool.name];
							const isInstalled = !!installedInfo;
							const activeVer =
								installedInfo?.find((v) => v.active) || installedInfo?.[0];

							return (
								<div
									key={tool.name}
									className="bg-[#121622] border border-[#20273a] hover:border-[#2f3954] rounded-xl p-4 flex flex-col justify-between transition-all space-y-3"
								>
									<div>
										<div className="flex items-center justify-between mb-1.5">
											<h3 className="font-semibold text-white capitalize text-sm tracking-wide">
												{tool.name}
											</h3>
											<span
												className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getBackendColor(
													tool.backend,
												)}`}
											>
												{tool.backend}
											</span>
										</div>

										<p className="text-[11px] text-gray-400 font-mono truncate bg-[#0a0c12] px-2 py-1 rounded border border-[#1b2030]">
											{tool.full_name}
										</p>

										{tool.description && (
											<p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
												{tool.description}
											</p>
										)}
									</div>

									<div className="pt-3 border-t border-[#1b2131] flex items-center justify-between">
										<div>
											{isInstalled ? (
												<span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 font-mono">
													<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
													<span>v{activeVer?.version || "installed"}</span>
												</span>
											) : (
												<span className="text-[11px] text-gray-500">
													Available
												</span>
											)}
										</div>

										<button
											onClick={() => onOpenSwitcher(tool.name)}
											className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
												isInstalled
													? "bg-[#181f2f] hover:bg-[#222b40] text-gray-200 border border-[#263147]"
													: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
											}`}
										>
											{isInstalled ? (
												<span>Manage</span>
											) : (
												<>
													<Download className="w-3.5 h-3.5 mr-0.5" />
													<span>Install</span>
												</>
											)}
										</button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Infinite Scroll Sentinel / Load More Footer */}
					{visibleCount < filteredTools.length && (
						<div
							ref={sentinelRef}
							className="py-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-gray-400"
						>
							<span className="animate-pulse">Loading more tools...</span>
							<button
								onClick={() =>
									setVisibleCount((prev) =>
										Math.min(prev + PAGE_SIZE, filteredTools.length),
									)
								}
								className="px-3 py-1.5 bg-[#171c2b] hover:bg-[#222a40] text-indigo-300 border border-[#2b354f] rounded-lg transition-colors font-medium"
							>
								Load next{" "}
								{Math.min(PAGE_SIZE, filteredTools.length - visibleCount)}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
