import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { V5Header } from "@/components/v5-header";

describe("V5 header", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "light";
    for (const id of ["home", "work", "process", "about", "contact"]) {
      const section = document.createElement("section");
      section.id = id;
      section.dataset.testSection = "true";
      document.body.appendChild(section);
    }
  });

  afterEach(() => {
    document.querySelectorAll("[data-test-section]").forEach((section) => section.remove());
  });

  it("persists an explicit dark-theme selection", async () => {
    const user = userEvent.setup();
    render(<V5Header />);
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("brishav-theme-v1")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("opens the mobile navigation and closes it after a section is selected", async () => {
    const user = userEvent.setup();
    render(<V5Header />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(mobileNavigation).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "03Process" }));
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
  });
});
