import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import type { LoginUseCase } from "../application/use-cases/LoginUseCase";
import type {
  AuthErrorType,
  LoginResult,
} from "../domain/contracts/LoginResult";
import { AuthError } from "../domain/errors/AuthError";
import { InvalidAccessTokenError } from "../domain/errors/InvalidAccessTokenError";
import { TodoistAuthConnectionError } from "../domain/errors/TodoistConnectionError";
import { AccessToken } from "../domain/value-objects/AccessToken";

export class AuthIpcController implements IpcController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  register(): void {
    ipcMain.handle(
      "auth:login",
      (_event, rawAccessToken: unknown): Promise<LoginResult> =>
        this.login(rawAccessToken),
    );
  }

  private async login(rawAccessToken: unknown): Promise<LoginResult> {
    const parsedToken = AccessToken.safeParse(
      typeof rawAccessToken === "string" ? rawAccessToken : "",
    );

    if (!parsedToken.success) {
      return {
        ok: false,
        error: { type: "unknown", message: parsedToken.error },
      };
    }

    try {
      const { user, tokenStorageWarning } = await this.loginUseCase.execute(
        parsedToken.data,
      );
      return { ok: true, user, tokenStorageWarning };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private getErrorType(error: unknown): AuthErrorType {
    if (error instanceof InvalidAccessTokenError) return "invalid_token";
    if (error instanceof TodoistAuthConnectionError) return "network_error";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof AuthError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while signing in";
  }
}
