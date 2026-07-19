import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CinematicProjectReel } from "@/components/cinematic-project-reel";

import { cinematicProgress } from "@/lib/progress-bus";

async function openMissionDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Browse all missions" }));
  return within(await screen.findByRole("dialog"));
}

describe("cinematic project reel", () => {
  it("filters the accessible index and keeps development claims truthful", async () => {
    const user = userEvent.setup();
    render(<CinematicProjectReel />);
    const drawer = await openMissionDrawer(user);

    await user.click(drawer.getByRole("button", { name: "Cloud" }));
    expect(drawer.getByRole("heading", { name: "Himalayan Data Observatory" })).toBeInTheDocument();
    expect(drawer.queryByRole("heading", { name: "Loan Default Prediction" })).not.toBeInTheDocument();

    await user.click(drawer.getByRole("button", { name: "All" }));
    const predictionCard = drawer.getByRole("heading", { name: "Loan Default Prediction" }).closest("article");
    expect(predictionCard).toHaveTextContent("In development");
    expect(predictionCard).not.toHaveTextContent(/accuracy|precision|recall/i);
  });

  it("opens an accessible mission drawer with published evidence", async () => {
    const user = userEvent.setup();
    render(<CinematicProjectReel />);
    const drawer = await openMissionDrawer(user);
    const firstCard = drawer.getByRole("heading", { name: "Loan Default Analysis" }).closest("article");
    expect(firstCard).toHaveTextContent("Published repository evidence reports");
    expect(within(firstCard as HTMLElement).getByRole("button", { name: "Direct this mission" })).toBeInTheDocument();
  });

  it("updates the accessible mission at exact progress boundaries in either direction", () => {
    cinematicProgress.publish("projects", 0);
    render(<CinematicProjectReel />);
    expect(screen.getByRole("heading", { name: "Loan Default Analysis" })).toBeInTheDocument();

    act(() => cinematicProgress.publish("projects", 0.51));
    expect(screen.getByRole("heading", { name: "Loan Default Prediction" })).toBeInTheDocument();

    act(() => cinematicProgress.publish("projects", 0.26));
    expect(screen.getByRole("heading", { name: "Financial Inclusion Gap Analysis" })).toBeInTheDocument();
  });
});
