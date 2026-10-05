import z from "zod";
import {
  DUE_VARIANTS,
  FILTER_CONJUNCTIONS,
  FILTER_KANBAN_STATUSES,
  FILTER_PRECEDENCES,
} from "@/entities/filter";
import { filterTitleSchema } from "@/main/filters";
import { PRIORITY_LEVELS } from "@/main/tasks";

export const filterFormSchema = z.object({
  title: filterTitleSchema,
  color: z.string(),
  projectId: z.string().nullable(),
  priorities: z.enum(PRIORITY_LEVELS).array(),
  due: z.enum(DUE_VARIANTS).nullable(),
  labels: z
    .string()
    .array()
    .refine(
      (labels) =>
        !labels.some((label) =>
          (FILTER_KANBAN_STATUSES as readonly string[]).includes(label),
        ),
      "Use the Kanban status field for todo / in-progress / completed",
    ),
  kanbanStatus: z.enum(FILTER_KANBAN_STATUSES).nullable(),
  // Per-field "NOT" and conjunction-to-the-next-defined-field (see
  // `FilterQueryFields`); `kanbanStatus` is always last, so it has no `next`.
  negated: z.object({
    project: z.boolean(),
    priorities: z.boolean(),
    due: z.boolean(),
    labels: z.boolean(),
    kanbanStatus: z.boolean(),
  }),
  next: z.object({
    project: z.enum(FILTER_CONJUNCTIONS),
    priorities: z.enum(FILTER_CONJUNCTIONS),
    due: z.enum(FILTER_CONJUNCTIONS),
    labels: z.enum(FILTER_CONJUNCTIONS),
  }),
  // Precedence of each `next` operator: "auto" or a rank (see `FILTER_PRECEDENCES`).
  prec: z.object({
    project: z.enum(FILTER_PRECEDENCES),
    priorities: z.enum(FILTER_PRECEDENCES),
    due: z.enum(FILTER_PRECEDENCES),
    labels: z.enum(FILTER_PRECEDENCES),
  }),
});

export type FilterFormValues = z.infer<typeof filterFormSchema>;
