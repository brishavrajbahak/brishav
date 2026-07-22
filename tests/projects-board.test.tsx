import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { V5SignalMandala } from "@/components/v5-signal-mandala";
import { projects } from "@/lib/content";

describe("V5 project proof and mandala", () => {
  it("keeps unfinished work explicit and free of invented model claims", () => {
    const prediction = projects.find((project) => project.id === "loan-default-prediction");
    expect(prediction?.status).toBe("In development");
    expect(prediction?.proof.businessImpact).toEqual(["Not established yet."]);
    expect(prediction?.proof.delivered).toEqual(["No public deliverable yet."]);
    expect(JSON.stringify(prediction)).not.toMatch(/accuracy|precision|recall/i);
  });

  it("marks the completed Financial Inclusion analysis with published proof", () => {
    const inclusion = projects.find((project) => project.id === "financial-inclusion-gap-analysis");
    expect(inclusion?.status).toBe("Published");
    expect(inclusion?.proof.methodology.source).toBe("World Bank Global Findex Database");
    expect(inclusion?.proof.delivered).toContain("Three Power BI report pages: Executive Overview, Nepal Account Gaps and 2024 Digital Access.");
    expect(inclusion?.proof.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Source observations", value: "8,577" })
    ]));
  });

  it("moves through project controls with arrows and opens the selected proof", async () => {
    const user = userEvent.setup();
    render(<V5SignalMandala />);

    const first = screen.getByRole("button", { name: "01Loan Default Analysis" });
    const second = screen.getByRole("button", { name: "02Financial Inclusion Gap Analysis" });
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");

    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(second).toHaveFocus();
    expect(screen.getByRole("heading", { name: "Financial Inclusion Gap Analysis", level: 3 })).toBeInTheDocument();

    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Financial Inclusion Gap Analysis" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("World Bank Global Findex Database");
    expect(dialog).toHaveTextContent("Executive Overview, Nepal Account Gaps and 2024 Digital Access");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(second).toHaveFocus());
  });

  it("opens published methodology without hiding the denominator", async () => {
    const user = userEvent.setup();
    render(<V5SignalMandala />);
    await user.click(screen.getByRole("button", { name: "Read the proof" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("1,348,099 loans with a final repayment or default outcome");
    expect(dialog).toHaveTextContent("Business impact");
    expect(dialog).toHaveTextContent("What I delivered");
  });
});
