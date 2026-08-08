import z from "zod";
import { KANBAN_STATUS_LEVELS, PRIORITY_LEVELS } from "@/main/tasks";

export const taskFormSchema = z.object({
  description: z.string(),
  projectId: z.string().min(1, "Project is required"),
  priority: z.enum(PRIORITY_LEVELS),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  kanbanStatus: z.enum(KANBAN_STATUS_LEVELS),
  labels: z.array(z.string()),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
