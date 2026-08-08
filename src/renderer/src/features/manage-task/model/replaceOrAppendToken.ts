import { parseQuickAdd, type QuickAddContext } from "../lib/parseQuickAdd";

/** Replaces a single-value quick-add token (priority/due/project/kanbanStatus)
 * in place, or appends it at the end when the field has no token yet — used
 * to push a manual field edit back into the title text (SPECIFICATION.md's
 * requirement: a manual field edit updates the corresponding keyword in the
 * input). `tokenText: null` removes the token instead of writing one. */
export const replaceOrAppendToken = (
  text: string,
  type: "priority" | "due" | "project" | "kanbanStatus",
  tokenText: string | null,
  context: QuickAddContext,
): string => {
  const { segments } = parseQuickAdd(text, context);
  let offset = 0;
  let matchStart = -1;
  let matchEnd = -1;
  for (const segment of segments) {
    if (segment.type === type) {
      matchStart = offset;
      matchEnd = offset + segment.text.length;
    }
    offset += segment.text.length;
  }

  if (matchStart === -1) {
    if (tokenText === null) return text;
    const trimmed = text.trimEnd();
    return trimmed.length > 0 ? `${trimmed} ${tokenText}` : tokenText;
  }

  if (tokenText === null) {
    return `${text.slice(0, matchStart)}${text.slice(matchEnd)}`
      .replace(/ {2,}/g, " ")
      .trim();
  }

  return `${text.slice(0, matchStart)}${tokenText}${text.slice(matchEnd)}`;
};
