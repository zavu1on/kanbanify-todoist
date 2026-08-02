import z from "zod";
import { accessTokenSchema, type LoginResult } from "@/main/auth";

export const authFormSchema = z.object({
  accessToken: accessTokenSchema,
});

export type AuthFormSchema = z.infer<typeof authFormSchema>;

export const loginWithAccessToken = (
  accessToken: string,
): Promise<LoginResult> => window.api.auth.login(accessToken);
