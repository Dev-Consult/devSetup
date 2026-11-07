import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";
import { useMiseStore } from "../../store/useMiseStore";

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
