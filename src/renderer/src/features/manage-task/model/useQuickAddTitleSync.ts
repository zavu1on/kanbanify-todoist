import type { UseFormReturnType } from "@mantine/form";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import type { LabelDTO } from "@/main/labels";
import {
  parseQuickAdd,
  type QuickAddContext,
  type QuickAddParseResult,
} from "../lib/parseQuickAdd";
import type { TaskFormValues } from "./taskFormSchema";
import { replaceOrAppendToken } from "./replaceOrAppendToken";

type UseQuickAddTitleSyncParams = {
  initialRawTitle: string;
  quickAddContext: QuickAddContext;
  form: UseFormReturnType<TaskFormValues>;
  knownLabels: LabelDTO[];
  onUnknownLabel: (name: string) => void;
};

/**
 * Owns the quick-add title text and keeps it in sync with the form fields in
 * both directions (SPECIFICATION.md "Добавление задачи"): typing a token
 * into the title updates the corresponding field (`handleTitleTextChange`),
 * and changing a field writes/removes its token in the title
 * (`resyncTitleToken`, `applyRawTitle` for the multi-value Labels field and
 * the project-mention autocomplete).
 */
export const useQuickAddTitleSync = ({
  initialRawTitle,
  quickAddContext,
  form,
  knownLabels,
  onUnknownLabel,
}: UseQuickAddTitleSyncParams) => {
  const [rawTitle, setRawTitle] = useState(initialRawTitle);
  const prevQuickAddRef = useRef<QuickAddParseResult | null>(null);

  const applyRawTitle = (text: string) => {
    setRawTitle(text);
    prevQuickAddRef.current = parseQuickAdd(text, quickAddContext);
  };

  const handleTitleTextChange = (text: string) => {
    setRawTitle(text);
    const next = parseQuickAdd(text, quickAddContext);
    const prev = prevQuickAddRef.current;
    // The baseline a field reverts to once its token is erased — the task's
    // original value in edit mode, the create-mode defaults otherwise (both
    // are exactly what `useForm` was seeded with, see `resetDirty` callers).
    const initial = form.getInitialValues();

    if (next.priority !== null) {
      form.setFieldValue("priority", next.priority);
    } else if (prev?.priority) {
      form.setFieldValue("priority", initial.priority);
    }

    if (next.due !== null) {
      form.setFieldValue("dueDate", next.due.date);
      form.setFieldValue(
        "dueTime",
        next.due.datetime ? dayjs(next.due.datetime).format("HH:mm") : null,
      );
    } else if (prev?.due) {
      form.setFieldValue("dueDate", initial.dueDate);
      form.setFieldValue("dueTime", initial.dueTime);
    }

    if (next.projectId !== null) {
      form.setFieldValue("projectId", next.projectId);
    } else if (prev?.projectId) {
      form.setFieldValue("projectId", initial.projectId);
    }

    if (next.kanbanStatus !== null) {
      form.setFieldValue("kanbanStatus", next.kanbanStatus);
    } else if (prev?.kanbanStatus) {
      form.setFieldValue("kanbanStatus", initial.kanbanStatus);
    }

    // Labels aren't fully owned by the title text (the task may already
    // carry labels never spelled out as `@token`s) — apply only the delta
    // between this parse and the last one, instead of replacing the field.
    const prevLabels = prev?.labels ?? [];
    const addedLabels = next.labels.filter((l) => !prevLabels.includes(l));
    const removedLabels = prevLabels.filter((l) => !next.labels.includes(l));
    if (addedLabels.length > 0 || removedLabels.length > 0) {
      form.setFieldValue("labels", [
        ...form.values.labels.filter((l) => !removedLabels.includes(l)),
        ...addedLabels.filter((l) => !form.values.labels.includes(l)),
      ]);
      for (const name of addedLabels) {
        const exists = knownLabels.some(
          (l) => l.name.toLowerCase() === name.toLowerCase(),
        );
        if (!exists) onUnknownLabel(name);
      }
    }

    prevQuickAddRef.current = next;
  };

  const resyncTitleToken = (
    type: "priority" | "due" | "project" | "kanbanStatus",
    tokenText: string | null,
  ) => {
    applyRawTitle(
      replaceOrAppendToken(rawTitle, type, tokenText, quickAddContext),
    );
  };

  return {
    rawTitle,
    quickAddSegments: parseQuickAdd(rawTitle, quickAddContext).segments,
    handleTitleTextChange,
    resyncTitleToken,
    applyRawTitle,
  };
};
