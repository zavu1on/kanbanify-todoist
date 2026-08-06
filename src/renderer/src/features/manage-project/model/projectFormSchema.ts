import z from "zod";
import { projectNameSchema } from "@/main/projects";

/** No sibling "no parent" value exists in Mantine's `Select` (it uses `null`/empty
 * for "nothing selected"), so `NO_PARENT_VALUE` is a real option value that gets
 * translated to `parentId: null` at submit time. */
export const NO_PARENT_VALUE = "none";

export const projectFormSchema = z.object({
  name: projectNameSchema,
  description: z.string(),
  color: z.string(),
  parentId: z.string(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
