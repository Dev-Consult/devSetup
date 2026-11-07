import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMiseStore } from "../../store/useMiseStore";
import { Header } from "./Header";

describe("Header component", () => {
	it("renders workspace toggle buttons", () => {
		render(<Header />);
		expect(screen.getByText(/Global/)).toBeDefined();
		expect(screen.getByText(/Project Workspace/)).toBeDefined();
	});

	it("switches workspace on click", () => {
		render(<Header />);
		const projectBtn = screen.getByText(/Project Workspace/);
		fireEvent.click(projectBtn);
		expect(useMiseStore.getState().workspace).toBe("project");
	});
});
