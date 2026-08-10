import { z } from "zod";

export const commentFormSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty"),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;
