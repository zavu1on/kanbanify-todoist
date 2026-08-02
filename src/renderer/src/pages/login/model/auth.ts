import z from "zod";

export const authFormSchema = z.object({
  accessToken: z
    .string()
    .trim()
    .min(32, "Access token is too short")
    .regex(/^\S+$/, "Access token must not contain whitespace"),
});

export type AuthFormSchema = z.infer<typeof authFormSchema>;
