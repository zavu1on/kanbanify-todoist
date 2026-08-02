import type { LoginResult } from "@/main/auth/domain/contracts/LoginResult";
import { accessTokenSchema } from "@/main/auth/domain/value-objects/AccessToken";
import z from "zod";

export const authFormSchema = z.object({
  accessToken: accessTokenSchema,
});

export type AuthFormSchema = z.infer<typeof authFormSchema>;

export const loginWithAccessToken = (
  accessToken: string,
): Promise<LoginResult> => window.api.auth.login(accessToken);
