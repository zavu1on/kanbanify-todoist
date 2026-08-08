import dayjs from "dayjs";
import { buildDueToken } from "./parseQuickAddDue";
import { parseQuickAdd } from "./parseQuickAdd";

// Wednesday — a fixed reference point so weekday-keyword resolution is deterministic.
const NOW = dayjs("2026-08-05T09:00:00");

const context = {
  projects: [],
  reservedLabels: ["todo", "in-progress", "completed"],
};

describe("parseQuickAdd — due", () => {
  it("resolves 'today' and 'tomorrow' relative to the reference date", () => {
    expect(parseQuickAdd("Call mom today", context, NOW).due).toEqual({
      date: "2026-08-05",
      datetime: null,
    });
    expect(parseQuickAdd("Call mom tomorrow", context, NOW).due).toEqual({
      date: "2026-08-06",
      datetime: null,
    });
  });

  it("resolves a bare weekday to its next occurrence, including today", () => {
    // NOW is a Wednesday — "wednesday" itself should resolve to today.
    expect(parseQuickAdd("Standup wednesday", context, NOW).due?.date).toBe(
      "2026-08-05",
    );
    expect(parseQuickAdd("Standup friday", context, NOW).due?.date).toBe(
      "2026-08-07",
    );
  });

  it("parses 'dd-mm-yyyy' and 'dd-mm' dates", () => {
    expect(parseQuickAdd("Date 12-08-2026", context, NOW).due?.date).toBe(
      "2026-08-12",
    );
    // Still ahead of NOW (2026-08-05) this year — stays in the current year.
    expect(parseQuickAdd("Date 12-08", context, NOW).due?.date).toBe(
      "2026-08-12",
    );
    // Already passed this year — rolls to the next occurrence.
    expect(parseQuickAdd("Date 01-01", context, NOW).due?.date).toBe(
      "2027-01-01",
    );
  });

  it("parses 'dd month' and 'dd month yyyy' dates", () => {
    expect(parseQuickAdd("Date 12 aug", context, NOW).due?.date).toBe(
      "2026-08-12",
    );
    expect(parseQuickAdd("Date 12 aug 2026", context, NOW).due?.date).toBe(
      "2026-08-12",
    );
    expect(parseQuickAdd("Date 12 august 2027", context, NOW).due?.date).toBe(
      "2027-08-12",
    );
    // Already passed this year — rolls to the next occurrence.
    expect(parseQuickAdd("Date 1 jan", context, NOW).due?.date).toBe(
      "2027-01-01",
    );
  });

  it("parses a trailing time as datetime, with and without 'at'", () => {
    const withAt = parseQuickAdd("Date tomorrow at 18:00", context, NOW);
    const bare = parseQuickAdd("Date tom 18:00", context, NOW);

    expect(withAt.due?.date).toBe("2026-08-06");
    expect(withAt.due?.datetime).toBe(
      dayjs("2026-08-06T18:00:00").toISOString(),
    );
    expect(bare.due).toEqual(withAt.due);
  });
});

describe("buildDueToken", () => {
  it("renders a date-only due as just the ISO date", () => {
    expect(buildDueToken({ date: "2026-08-10", datetime: null })).toBe(
      "2026-08-10",
    );
  });

  it("renders a due with time as 'date HH:mm'", () => {
    expect(
      buildDueToken({
        date: "2026-08-10",
        datetime: dayjs("2026-08-10T18:00:00").toISOString(),
      }),
    ).toBe("2026-08-10 18:00");
  });
});
