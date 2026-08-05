import z from "zod";
import { accessTokenSchema } from "@/main/auth";

export const authFormSchema = z.object({
  accessToken: accessTokenSchema,
});

export type AuthFormSchema = z.infer<typeof authFormSchema>;
