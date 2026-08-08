import type { RawMatch } from "./types";

/** Drops matches overlapping an already-accepted one, left to right. */
export const dropOverlaps = (matches: RawMatch[]): RawMatch[] => {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const accepted: RawMatch[] = [];
  let lastEnd = -1;
  for (const match of sorted) {
    if (match.start < lastEnd) continue;
    accepted.push(match);
    lastEnd = match.end;
  }
  return accepted;
};
