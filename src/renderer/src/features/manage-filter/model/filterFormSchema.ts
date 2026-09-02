import z from "zod";
import { DUE_VARIANTS, FILTER_CONJUNCTIONS } from "@/entities/filter";
import { filterTitleSchema } from "@/main/filters";
import { PRIORITY_LEVELS } from "@/main/tasks";

export const filterFormSchema = z.object({
  title: filterTitleSchema,
  color: z.string(),
  projectId: z.string().nullable(),
  priorities: z.enum(PRIORITY_LEVELS).array(),
  due: z.enum(DUE_VARIANTS).nullable(),
  labels: z.string().array(),
  conjunction: z.enum(FILTER_CONJUNCTIONS),
});

export type FilterFormValues = z.infer<typeof filterFormSchema>;
