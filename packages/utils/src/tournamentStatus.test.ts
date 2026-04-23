import { describe, it, expect, vi, afterEach } from "vitest";
import { getTournamentStatus, resolveTournamentStatus } from "./tournamentStatus";

// Helper to create UTC dates matching Prisma @db.Date behavior
function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("getTournamentStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Scheduled when today is before start_date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 1)); // April 1

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Scheduled");
  });

  it("returns Active on the start_date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 10)); // April 10 = start

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Active");
  });

  it("returns Active during the tournament", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 12)); // April 12 = mid-tournament

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Active");
  });

  it("returns Active on the end_date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 13)); // April 13 = end day

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Active");
  });

  it("returns Completed the day after end_date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 14)); // April 14 = day after

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Completed");
  });

  it("returns Completed well after end_date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 6, 1)); // June 1

    expect(getTournamentStatus(utcDate(2026, 4, 10), utcDate(2026, 4, 13))).toBe("Completed");
  });

  it("handles single-day tournaments correctly", () => {
    vi.useFakeTimers();

    vi.setSystemTime(utcDate(2026, 5, 15));
    expect(getTournamentStatus(utcDate(2026, 5, 15), utcDate(2026, 5, 15))).toBe("Active");

    vi.setSystemTime(utcDate(2026, 5, 14));
    expect(getTournamentStatus(utcDate(2026, 5, 15), utcDate(2026, 5, 15))).toBe("Scheduled");

    vi.setSystemTime(utcDate(2026, 5, 16));
    expect(getTournamentStatus(utcDate(2026, 5, 15), utcDate(2026, 5, 15))).toBe("Completed");
  });
});

describe("resolveTournamentStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Scheduled when DB says Scheduled and start_date is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 1));

    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Scheduled",
      })
    ).toBe("Scheduled");
  });

  it("auto-advances Scheduled to Active when start_date has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 11));

    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Scheduled",
      })
    ).toBe("Active");
  });

  it("auto-advances Scheduled to Active on the start_date itself", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 10));

    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Scheduled",
      })
    ).toBe("Active");
  });

  it("respects Active status from DB (admin set it manually)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 1)); // Before start!

    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Active",
      })
    ).toBe("Active");
  });

  it("respects Completed status from DB", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 12)); // Mid-tournament!

    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Completed",
      })
    ).toBe("Completed");
  });

  it("does NOT auto-advance to Completed even when end_date passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 20)); // Well past end_date

    // DB still says "Active" — admin hasn't confirmed completion
    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Active",
      })
    ).toBe("Active");
  });

  it("does NOT auto-advance Scheduled to Completed (stays Active)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 20)); // Well past end_date

    // DB says "Scheduled" but both start and end have passed
    // Should advance to Active (not Completed — completion requires admin)
    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Scheduled",
      })
    ).toBe("Active");
  });

  it("respects Excluded status even when start_date has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(utcDate(2026, 4, 12)); // Mid-tournament

    // Excluded means the admin manually turned off auto-sync for this tournament
    // (e.g. Pro-Am format that breaks ESPN validator). Must not auto-advance.
    expect(
      resolveTournamentStatus({
        start_date: utcDate(2026, 4, 10),
        end_date: utcDate(2026, 4, 13),
        status: "Excluded",
      })
    ).toBe("Excluded");
  });
});
