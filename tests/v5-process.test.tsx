import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { V5Process } from "@/components/v5-process";

describe("V5 Process", () => {
  beforeEach(() => {
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
  });

  it("changes phase with the arrow controls without scrolling the page", async () => {
    const user = userEvent.setup();
    render(<V5Process />);

    expect(screen.getByRole("heading", { name: "Raw records" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next process phase" }));

    expect(screen.getByRole("heading", { name: "Clean columns" })).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
