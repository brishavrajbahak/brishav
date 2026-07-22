import type { AnalysisMode } from "./api";

export type TerminalAction =
  | { type: "none" }
  | { type: "focus-mandala" }
  | { type: "select-dataset"; datasetId: string; mode?: AnalysisMode }
  | { type: "select-project"; projectId: string };

export type TerminalResult = {
  lines: string[];
  action: TerminalAction;
};

const DATASET_ALIASES: Record<string, string> = {
  loan: "loan-risk",
  risk: "loan-risk",
  "loan-risk": "loan-risk",
  tourism: "tourism",
  remittance: "remittance"
};

const MODES = new Set<AnalysisMode>(["overview", "distribution", "trend"]);

export function runTerminalCommand(rawCommand: string): TerminalResult {
  const command = rawCommand.trim().toLowerCase();
  const [verb = "", ...args] = command.split(/\s+/);

  if (!verb) return { lines: ["Type help to list observatory commands."], action: { type: "none" } };

  if (verb === "help") {
    return {
      lines: [
        "help · whoami · projects · skills · mandala · datasets",
        "analyze <tourism|loan-risk|remittance> <overview|distribution|trend>"
      ],
      action: { type: "none" }
    };
  }
  if (verb === "whoami") {
    return {
      lines: ["Brishav Rajbahak", "Data analyst and data science aspirant · Kathmandu, Nepal"],
      action: { type: "none" }
    };
  }
  if (verb === "skills") {
    return {
      lines: ["Python · SQL · Power BI · Cloud", "Focus: clear analysis, truthful evidence, useful decisions"],
      action: { type: "none" }
    };
  }
  if (verb === "projects") {
    return {
      lines: [
        "01 Loan Default Analysis — published",
        "02 Financial Inclusion — published",
        "03 Loan Prediction — in development",
        "04 Himalayan Observatory — live system"
      ],
      action: { type: "select-project", projectId: "loan-default-analysis" }
    };
  }
  if (verb === "mandala") {
    return {
      lines: ["Signal mandala focused. Select a node to inspect its analytical relationship."],
      action: { type: "focus-mandala" }
    };
  }
  if (verb === "datasets") {
    return {
      lines: ["tourism · loan-risk · remittance", "Use analyze <dataset> <mode> to run the shared laboratory."],
      action: { type: "none" }
    };
  }
  if (verb === "analyze") {
    const datasetId = DATASET_ALIASES[args[0] || ""];
    const requestedMode = args[1] as AnalysisMode | undefined;
    const mode = requestedMode && MODES.has(requestedMode) ? requestedMode : "overview";
    if (!datasetId) {
      return {
        lines: ["Unknown dataset. Try: tourism, loan-risk, or remittance."],
        action: { type: "none" }
      };
    }
    return {
      lines: [`Routing ${datasetId} to the ${mode} analytical view…`],
      action: { type: "select-dataset", datasetId, mode }
    };
  }

  return {
    lines: [`Command not found: ${verb}`, "Type help for available commands."],
    action: { type: "none" }
  };
}
