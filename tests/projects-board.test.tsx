import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CinematicProjectReel } from "@/components/cinematic-project-reel";

function projectGrid() {
  const grid = document.querySelector(".v3-project-card-grid");
  if (!grid) throw new Error("Project grid was not rendered.");
  return within(grid as HTMLElement);
}

describe("cinematic project reel", () => {
  it("filters the accessible index and keeps development claims truthful", async () => {
    const user = userEvent.setup();
    render(<CinematicProjectReel />);

    await user.click(screen.getByRole("button", { name: "Cloud" }));
    expect(projectGrid().getByRole("heading", { name: "Himalayan Data Observatory" })).toBeInTheDocument();
    expect(projectGrid().queryByRole("heading", { name: "Loan Default Prediction" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    const predictionCard = projectGrid().getByRole("heading", { name: "Loan Default Prediction" }).closest("article");
    expect(predictionCard).toHaveTextContent("In development");
    expect(predictionCard).not.toHaveTextContent(/accuracy|precision|recall/i);
  });

  it("opens an accessible project briefing", async () => {
    const user = userEvent.setup();
    render(<CinematicProjectReel />);
    const firstCard = projectGrid().getByRole("heading", { name: "Loan Default Analysis" }).closest("article");
    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Open briefing" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Published repository evidence reports");
  });
});
