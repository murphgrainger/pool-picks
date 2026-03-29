import { describe, it, expect } from "vitest";
import { getEffectivePoolPhase } from "./poolPhase";

describe("getEffectivePoolPhase", () => {
  // Setup pool — always "setup" regardless of tournament status
  it("returns setup for Setup pools regardless of tournament status", () => {
    expect(getEffectivePoolPhase("Setup", "Scheduled")).toBe("setup");
    expect(getEffectivePoolPhase("Setup", "Active")).toBe("setup");
    expect(getEffectivePoolPhase("Setup", "Completed")).toBe("setup");
  });

  // Open pool — always "open" regardless of tournament status
  it("returns open for Open pools regardless of tournament status", () => {
    expect(getEffectivePoolPhase("Open", "Scheduled")).toBe("open");
    expect(getEffectivePoolPhase("Open", "Active")).toBe("open");
    expect(getEffectivePoolPhase("Open", "Completed")).toBe("open");
  });

  // Locked pool — phase depends on tournament status
  it("returns locked-awaiting for Locked pool with Scheduled tournament", () => {
    expect(getEffectivePoolPhase("Locked", "Scheduled")).toBe("locked-awaiting");
  });

  it("returns live for Locked pool with Active tournament", () => {
    expect(getEffectivePoolPhase("Locked", "Active")).toBe("live");
  });

  it("returns completed for Locked pool with Completed tournament", () => {
    expect(getEffectivePoolPhase("Locked", "Completed")).toBe("completed");
  });

  // Complete pool — always "completed" regardless of tournament status
  it("returns completed for Complete pools regardless of tournament status", () => {
    expect(getEffectivePoolPhase("Complete", "Scheduled")).toBe("completed");
    expect(getEffectivePoolPhase("Complete", "Active")).toBe("completed");
    expect(getEffectivePoolPhase("Complete", "Completed")).toBe("completed");
  });

  // Legacy "Active" pool status — treated same as Locked until migration runs
  it("treats legacy Active pool status same as Locked", () => {
    expect(getEffectivePoolPhase("Active", "Scheduled")).toBe("locked-awaiting");
    expect(getEffectivePoolPhase("Active", "Active")).toBe("live");
    expect(getEffectivePoolPhase("Active", "Completed")).toBe("completed");
  });

  // Edge case: unknown pool status
  it("defaults to setup for unknown pool status", () => {
    expect(getEffectivePoolPhase("Unknown", "Active")).toBe("setup");
  });
});
