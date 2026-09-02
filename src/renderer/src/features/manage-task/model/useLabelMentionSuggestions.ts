import type { UseFormReturnType } from "@mantine/form";
import { buildLabelToken } from "../lib/parseQuickAdd";
import type { TaskFormValues } from "./taskFormSchema";

type UseLabelMentionSuggestionsParams = {
  rawTitle: string;
  labelOptions: string[];
  form: UseFormReturnType<TaskFormValues>;
  applyRawTitle: (text: string) => void;
};

// ponytail: only matches an "@query" sitting at the very end of the title —
// same "typing forward" scope as `useProjectMentionSuggestions`'s
// `DANGLING_PROJECT_RE`, not editing a `@token` that's no longer at the caret.
const DANGLING_LABEL_RE = /@(\S*)$/;

/**
 * Autocomplete for the `@label` quick-add token — the label counterpart of
 * `useProjectMentionSuggestions`. Suggests known labels matching an
 * `@`-prefixed query still being typed at the end of the title; `labelOptions`
 * is expected pre-filtered of reserved kanban labels (see `TaskFormFields`),
 * so those never show up as a mention suggestion either.
 */
export const useLabelMentionSuggestions = ({
  rawTitle,
  labelOptions,
  form,
  applyRawTitle,
}: UseLabelMentionSuggestionsParams) => {
  const danglingMatch = DANGLING_LABEL_RE.exec(rawTitle);
  const danglingQuery = danglingMatch?.[1] ?? null;

  const labelSuggestions =
    danglingQuery !== null &&
    !labelOptions.some(
      (label) => label.toLowerCase() === danglingQuery.toLowerCase(),
    )
      ? labelOptions
          .filter((label) =>
            label.toLowerCase().startsWith(danglingQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  const selectLabelSuggestion = (label: string) => {
    if (!danglingMatch) return;

    const matchStart = rawTitle.length - danglingMatch[0].length;
    const newRawTitle = `${rawTitle.slice(0, matchStart)}${buildLabelToken(label)} `;

    applyRawTitle(newRawTitle);
    if (!form.values.labels.includes(label)) {
      form.setFieldValue("labels", [...form.values.labels, label]);
    }
  };

  return { labelSuggestions, selectLabelSuggestion };
};
