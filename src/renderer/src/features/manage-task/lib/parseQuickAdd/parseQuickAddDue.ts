import dayjs from "dayjs";
import type { RawMatch } from "./types";

const DAY_KEYWORDS = [
  "today",
  "tomorrow",
  "tom",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTH_NAMES = [
  ["jan", "january"],
  ["feb", "february"],
  ["mar", "march"],
  ["apr", "april"],
  ["may"],
  ["jun", "june"],
  ["jul", "july"],
  ["aug", "august"],
  ["sep", "september"],
  ["oct", "october"],
  ["nov", "november"],
  ["dec", "december"],
] as const;

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.flatMap((names, index) => names.map((name) => [name, index])),
);

// Longest name first so the regex doesn't lock onto "aug" and leave "ust"
// dangling before backtracking finds "august".
const MONTH_PATTERN = MONTH_NAMES.flat()
  .sort((a, b) => b.length - a.length)
  .join("|");

// ponytail: covers today/tomorrow/weekday keywords, ISO/`dd-mm[-yyyy]`/
// `dd month [year]` dates, and an optional trailing time ("tom 18:00" /
// "tom at 18:00") — not full natural-language parsing ("in 3 days", "next
// month"). Add patterns here when needed.
const DATE_TOKEN_RE = new RegExp(
  "\\b(" +
    `${DAY_KEYWORDS.join("|")}` +
    "|\\d{4}-\\d{2}-\\d{2}" + // 2026-08-12 (ISO, yyyy-mm-dd)
    "|\\d{1,2}-\\d{1,2}-\\d{4}" + // 12-08-2026 (dd-mm-yyyy)
    "|\\d{1,2}-\\d{1,2}" + // 12-08 (dd-mm, year inferred)
    `|\\d{1,2}\\s+(?:${MONTH_PATTERN})(?:\\s+\\d{4})?` + // 12 aug / 12 august 2026
    ")\\b(?:\\s+(?:at\\s+)?([01]?\\d|2[0-3]):([0-5]\\d))?",
  "gi",
);

/** A day+month with no year resolves to the nearest occurrence at or after
 * `now` — this year if it hasn't passed yet, otherwise next year. Mirrors
 * the "next occurrence, including today" rule already used for bare
 * weekdays below. */
const resolveYearlessDate = (
  day: number,
  monthIndex: number,
  now: dayjs.Dayjs,
): dayjs.Dayjs => {
  const candidate = now.month(monthIndex).date(day);
  return candidate.isBefore(now, "day") ? candidate.add(1, "year") : candidate;
};

const resolveDateKeyword = (keyword: string, now: dayjs.Dayjs): dayjs.Dayjs => {
  const lower = keyword.toLowerCase();

  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) return dayjs(lower);

  const dmyMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(lower);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return dayjs(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }

  const dmMatch = /^(\d{1,2})-(\d{1,2})$/.exec(lower);
  if (dmMatch) {
    const [, day, month] = dmMatch;
    return resolveYearlessDate(Number(day), Number(month) - 1, now);
  }

  const monthNameMatch = /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/.exec(lower);
  if (monthNameMatch) {
    const [, day, monthName, year] = monthNameMatch;
    const monthIndex = MONTH_INDEX[monthName];
    return year
      ? dayjs(
          `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`,
        )
      : resolveYearlessDate(Number(day), monthIndex, now);
  }

  if (lower === "today") return now;
  if (lower === "tomorrow" || lower === "tom") return now.add(1, "day");

  const targetDow = WEEKDAY_INDEX[lower];
  const diff = (targetDow - now.day() + 7) % 7;
  return now.add(diff, "day");
};

export const collectDateMatches = (
  text: string,
  now: dayjs.Dayjs,
): RawMatch[] => {
  const matches: RawMatch[] = [];
  for (const match of text.matchAll(DATE_TOKEN_RE)) {
    const [raw, keyword, hour, minute] = match;
    const start = match.index ?? 0;
    const target = resolveDateKeyword(keyword, now);
    const date = target.format("YYYY-MM-DD");
    const datetime =
      hour !== undefined && minute !== undefined
        ? target
            .hour(Number(hour))
            .minute(Number(minute))
            .second(0)
            .millisecond(0)
            .toISOString()
        : null;

    matches.push({
      start,
      end: start + raw.length,
      type: "due",
      due: { date, datetime },
    });
  }
  return matches;
};

/** Builds the canonical token text for a manually-changed due date, so
 * `resyncTitleToken` can insert/replace it in the title (SPECIFICATION.md's
 * requirement: a manual field edit updates the corresponding keyword in the
 * input). Always the ISO form, even when a natural-language keyword would
 * also parse — unambiguous and trivially round-trips through `parseQuickAdd`. */
export const buildDueToken = (due: {
  date: string;
  datetime: string | null;
}) =>
  due.datetime
    ? `${due.date} ${dayjs(due.datetime).format("HH:mm")}`
    : due.date;
