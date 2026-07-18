import { describe, expect, it } from "vitest";
import { runTerminalCommand } from "@/lib/terminal";

describe("observatory terminal", () => {
  it("returns the supported command index", () => {
    const result = runTerminalCommand("help");
    expect(result.lines.join(" ")).toContain("whoami");
    expect(result.lines.join(" ")).toContain("analyze");
  });

  it("routes dataset aliases to the shared analytical state", () => {
    expect(runTerminalCommand("analyze loan distribution").action).toEqual({
      type: "select-dataset",
      datasetId: "loan-risk",
      mode: "distribution"
    });
    expect(runTerminalCommand("analyze remittance trend").action).toEqual({
      type: "select-dataset",
      datasetId: "remittance",
      mode: "trend"
    });
  });

  it("rejects unknown datasets without mutating selection", () => {
    const result = runTerminalCommand("analyze imaginary overview");
    expect(result.action).toEqual({ type: "none" });
    expect(result.lines[0]).toContain("Unknown dataset");
  });

  it("keeps truthful project statuses in terminal output", () => {
    const result = runTerminalCommand("projects");
    expect(result.lines).toContain("03 Loan Prediction — in development");
    expect(result.lines.join(" ")).not.toContain("accuracy");
  });
});
