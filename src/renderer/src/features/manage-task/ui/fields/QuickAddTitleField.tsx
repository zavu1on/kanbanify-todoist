import { Box, Paper, Stack, UnstyledButton } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { type Ref, useImperativeHandle } from "react";
import type { QuickAddContext } from "../../lib/parseQuickAdd";
import type { TaskFormValues } from "../../model/taskFormSchema";
import { useProjectMentionSuggestions } from "../../model/useProjectMentionSuggestions";
import { useQuickAddTitleSync } from "../../model/useQuickAddTitleSync";
import { QuickAddTitleInput } from "../QuickAddTitleInput";

export type QuickAddTitleFieldHandle = {
  getRawTitle: () => string;
  applyRawTitle: (text: string) => void;
  resyncTitleToken: (
    type: "priority" | "due" | "project" | "kanbanStatus",
    tokenText: string | null,
  ) => void;
};

type QuickAddTitleFieldProps = {
  ref: Ref<QuickAddTitleFieldHandle>;
  form: UseFormReturnType<TaskFormValues>;
  projects: { id: string; name: string }[];
  quickAddContext: QuickAddContext;
  initialRawTitle: string;
  onSubmit: () => void;
};

/**
 * Owns the quick-add title text — its own component so typing it, or a
 * sibling field resyncing its token into it, only re-renders this input,
 * not every other field in `TaskFormFields`. `resyncTitleToken`/
 * `applyRawTitle`/`getRawTitle` are exposed imperatively so sibling field
 * components can drive this one (and read its text at submit/dirty-check
 * time) without subscribing to it themselves.
 */
export const QuickAddTitleField = ({
  ref,
  form,
  projects,
  quickAddContext,
  initialRawTitle,
  onSubmit,
}: QuickAddTitleFieldProps) => {
  const {
    rawTitle,
    quickAddSegments,
    handleTitleTextChange,
    resyncTitleToken,
    applyRawTitle,
  } = useQuickAddTitleSync({
    initialRawTitle,
    quickAddContext,
    form,
  });

  useImperativeHandle(ref, () => ({
    getRawTitle: () => rawTitle,
    applyRawTitle,
    resyncTitleToken,
  }));

  const { projectSuggestions, selectProjectSuggestion } =
    useProjectMentionSuggestions({ rawTitle, projects, form, applyRawTitle });

  return (
    <Box pos="relative" style={{ flex: 1 }}>
      <QuickAddTitleInput
        segments={quickAddSegments}
        onTextChange={handleTitleTextChange}
        onSubmit={onSubmit}
        placeholder="Task name — try 'tomorrow at 18:00 p1 @errand #Work @todo'"
      />
      {projectSuggestions.length > 0 && (
        <Paper
          withBorder
          shadow="sm"
          pos="absolute"
          top="100%"
          left={0}
          right={0}
          style={{ zIndex: 200 }}
        >
          <Stack gap={0}>
            {projectSuggestions.map((project) => (
              <UnstyledButton
                key={project.id}
                px="sm"
                py={6}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectProjectSuggestion(project)}
              >
                {project.name}
              </UnstyledButton>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
