import type { UseFormReturnType } from "@mantine/form";
import { buildProjectToken } from "../lib/parseQuickAdd";
import type { TaskFormValues } from "./taskFormSchema";

type UseProjectMentionSuggestionsParams = {
  rawTitle: string;
  projects: { id: string; name: string }[];
  form: UseFormReturnType<TaskFormValues>;
  applyRawTitle: (text: string) => void;
};

// ponytail: only matches a "#query" sitting at the very end of the title —
// covers the common "typing forward" flow, not editing a #token that's no
// longer at the caret.
const DANGLING_PROJECT_RE = /#(\S*)$/;

/**
 * Autocomplete for the `#project` quick-add token: suggests known projects
 * matching a `#`-prefixed query still being typed at the end of the title.
 * Suggestions hide once the query exactly matches a known project, since
 * `parseQuickAdd` already recognizes it by then.
 */
export const useProjectMentionSuggestions = ({
  rawTitle,
  projects,
  form,
  applyRawTitle,
}: UseProjectMentionSuggestionsParams) => {
  const danglingMatch = DANGLING_PROJECT_RE.exec(rawTitle);
  const danglingQuery = danglingMatch?.[1] ?? null;

  const projectSuggestions =
    danglingQuery !== null &&
    !projects.some((p) => p.name.toLowerCase() === danglingQuery.toLowerCase())
      ? projects
          .filter((p) =>
            p.name.toLowerCase().startsWith(danglingQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  const selectProjectSuggestion = (project: { id: string; name: string }) => {
    if (!danglingMatch) return;

    const matchStart = rawTitle.length - danglingMatch[0].length;
    const token = buildProjectToken(project.name);
    const newRawTitle = token
      ? `${rawTitle.slice(0, matchStart)}${token} `
      : rawTitle.slice(0, matchStart).trimEnd();

    applyRawTitle(newRawTitle);
    form.setFieldValue("projectId", project.id);
  };

  return { projectSuggestions, selectProjectSuggestion };
};
