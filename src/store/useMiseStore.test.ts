import { beforeEach, describe, expect, it } from "vitest";
import { useMiseStore } from "./useMiseStore";

describe("useMiseStore", () => {
	beforeEach(() => {
		useMiseStore.setState({
			activeTab: "enterprise",
			workspace: "global",
			tools: {},
			presets: [],
			envVars: {},
			diagnosticReport: null,
			terminalLogs: [],
		});
	});

	it("updates active tab correctly", () => {
		const { setActiveTab } = useMiseStore.getState();
		setActiveTab("diagnostics");
		expect(useMiseStore.getState().activeTab).toBe("diagnostics");
	});

	it("switches workspace and loads data", async () => {
		const { setWorkspace } = useMiseStore.getState();
		setWorkspace("project");
		expect(useMiseStore.getState().workspace).toBe("project");

		await useMiseStore.getState().loadData();
		const state = useMiseStore.getState();
		expect(Object.keys(state.tools).length).toBeGreaterThan(0);
		expect(state.presets.length).toBeGreaterThan(0);
		expect(state.syncStatus).toBeDefined();
	});

	it("executes diagnostic probe and sets report", async () => {
		const { runDiagnostic, setDiagTool } = useMiseStore.getState();
		setDiagTool("npm");
		await runDiagnostic();

		const state = useMiseStore.getState();
		expect(state.diagnosticReport).not.toBeNull();
		expect(state.diagnosticReport?.tool).toBe("npm");
		expect(state.diagnosticReport?.static_env_ok).toBe(true);
	});
});
