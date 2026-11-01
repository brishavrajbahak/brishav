import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CinematicIntro } from "@/components/cinematic-intro";
import { INTRO_SESSION_KEY } from "@/lib/cinematic";

describe("cinematic introduction", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  it("can be skipped and records completion for the browser session", async () => {
    const user = userEvent.setup();
    render(<CinematicIntro />);
    await act(async () => Promise.resolve());
    const skip = await screen.findByRole("button", { name: /skip introduction/i });
    await user.click(skip);
    expect(screen.queryByRole("dialog", { name: /cinematic introduction/i })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(INTRO_SESSION_KEY)).toBe("complete");
  });

  it("does not replay for a returning session", async () => {
    sessionStorage.setItem(INTRO_SESSION_KEY, "complete");
    render(<CinematicIntro />);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("dialog", { name: /cinematic introduction/i })).not.toBeInTheDocument();
  });

  it("enters immediately on the static mobile experience", async () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<CinematicIntro />);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("dialog", { name: /cinematic introduction/i })).not.toBeInTheDocument();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
  });
});
