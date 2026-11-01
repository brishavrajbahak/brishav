import { describe, expect, it, vi } from "vitest";
import { cinematicProgress } from "@/lib/progress-bus";

describe("cinematic progress bus", () => {
  it("clamps progress and notifies subscribers without DOM events", () => {
    cinematicProgress.publish("home", 0);
    const listener = vi.fn();
    const unsubscribe = cinematicProgress.subscribe("home", listener);

    cinematicProgress.publish("home", 0.42);
    cinematicProgress.publish("home", 1.8);
    cinematicProgress.publish("home", 1.8);

    expect(listener.mock.calls.map(([value]) => value)).toEqual([0, 0.42, 1]);
    expect(cinematicProgress.read("home")).toBe(1);
    unsubscribe();
  });

  it("emits active navigation only when the section changes", () => {
    cinematicProgress.setActiveSection("home");
    const listener = vi.fn();
    const unsubscribe = cinematicProgress.subscribeActiveSection(listener);

    cinematicProgress.setActiveSection("projects");
    cinematicProgress.setActiveSection("projects");
    cinematicProgress.setActiveSection("journey");

    expect(listener.mock.calls.map(([section]) => section)).toEqual(["home", "projects", "journey"]);
    unsubscribe();
  });
});

