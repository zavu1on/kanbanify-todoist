import {
  buildLabelToken,
  parseQuickAdd,
  type QuickAddContext,
} from "../lib/parseQuickAdd";

/** Replaces every `@label` token in the title with tokens for `newLabels`,
 * used to push a Labels-field edit back into the title text (same
 * round-trip requirement as `replaceOrAppendToken`, but the Labels field is
 * multi-value so it rewrites the whole set instead of a single token). */
export const syncLabelTokens = (
  text: string,
  newLabels: string[],
  context: QuickAddContext,
): string => {
  const { segments } = parseQuickAdd(text, context);
  const stripped = segments
    .filter((segment) => segment.type !== "label")
    .map((segment) => segment.text)
    .join("")
    .replace(/ {2,}/g, " ")
    .trim();

  if (newLabels.length === 0) return stripped;
  const tokens = newLabels.map(buildLabelToken).join(" ");
  return stripped.length > 0 ? `${stripped} ${tokens}` : tokens;
};
