import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectsBoard } from "@/components/projects-board";
import { TooltipProvider } from "@/components/ui/tooltip";

function renderBoard() {
  return render(<TooltipProvider><ProjectsBoard quality="poster" /></TooltipProvider>);
}

describe("project mission board", () => {
  it("filters by skill and keeps development claims truthful", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: "Cloud" }));
    expect(screen.getByRole("heading", { name: "Himalayan Data Observatory" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Loan Default Prediction" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.queryByText("In development—no results claimed.", { exact: false })).not.toBeInTheDocument();
    const predictionCard = screen.getByRole("heading", { name: "Loan Default Prediction" }).closest("article");
    expect(predictionCard).toHaveTextContent("In development");
  });

  it("opens an accessible project briefing", async () => {
    const user = userEvent.setup();
    renderBoard();
    const firstCard = screen.getByRole("heading", { name: "Loan Default Analysis" }).closest("article");
    await user.click(firstCard!.querySelector("button")!);
    expect(await screen.findByRole("dialog")).toHaveTextContent("Published repository evidence reports");
  });
});
