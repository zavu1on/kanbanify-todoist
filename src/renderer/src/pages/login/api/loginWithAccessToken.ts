import type { LoginResult } from "@/main/auth";

export const loginWithAccessToken = (
  accessToken: string,
): Promise<LoginResult> => window.api.auth.login(accessToken);
