import { describe, expect, it } from "vitest";
import { personalStory, projects, siteConfig } from "@/lib/content";

describe("V5 proof-first content", () => {
  it("preserves Brishav's unedited About text and personal rule", () => {
    expect(personalStory.about).toBe("It's me Brishav Rajbahak. Currently an undergraduate student learning new things and tools which i feel fascinating . i relate myself to the tech-enthuiast and wanna build cool things which not only exists but resonates well to the make an earth better place");
    expect(personalStory.rule).toBe("being better than yesterday . just iterating the level even if its a word or an entire dictionary");
  });

  it("publishes the resolved-outcome denominator and the exclusion reason together", () => {
    const loanProject = projects.find((project) => project.id === "loan-default-analysis");
    const method = loanProject?.proof.methodology;
    expect(method?.numerator).toBe(269_360);
    expect(method?.denominator).toBe(1_348_099);
    expect(Number(((method!.numerator! / method!.denominator!) * 100).toFixed(2))).toBe(19.98);
    expect(method?.excludedRows).toBe(912_569);
    expect(method?.exclusionReason).toMatch(/current, late or in a grace period/i);
  });

  it("requires proof fields and repositories for every listed project", () => {
    for (const project of projects) {
      expect(project.proof.businessImpact.length).toBeGreaterThan(0);
      expect(project.proof.delivered.length).toBeGreaterThan(0);
      expect(project.repository).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("keeps audited generic phrases out of the public content source", () => {
    const copy = JSON.stringify({ siteConfig, personalStory, projects }).toLowerCase();
    expect(copy).not.toContain("evidence-led");
    expect(copy).not.toContain("actionable");
    expect(copy).not.toContain("legible");
  });
});
