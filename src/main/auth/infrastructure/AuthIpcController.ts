import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import type { CheckSessionUseCase } from "../application/use-cases/CheckSessionUseCase";
import type { LoginUseCase } from "../application/use-cases/LoginUseCase";
import type { LogoutUseCase } from "../application/use-cases/LogoutUseCase";
import type { AuthErrorType } from "../domain/contracts/AuthFailure";
import type { LoginResult } from "../domain/contracts/LoginResult";
import type { LogoutResult } from "../domain/contracts/LogoutResult";
import type { SessionCheckResult } from "../domain/contracts/SessionCheckResult";
import { AuthError } from "../domain/errors/AuthError";
import { InvalidAccessTokenError } from "../domain/errors/InvalidAccessTokenError";
import { TodoistAuthConnectionError } from "../domain/errors/TodoistAuthConnectionError";
import { AccessToken } from "../domain/value-objects/AccessToken";
import { AuthenticatedUserMapper } from "../domain/mappers/AuthenticatedUserMapper";

export class AuthIpcController implements IpcController {
  private readonly userMapper = new AuthenticatedUserMapper();

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly checkSessionUseCase: CheckSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "auth:login",
      (_event, rawAccessToken: unknown): Promise<LoginResult> =>
        this.login(rawAccessToken),
    );
    ipcMain.handle(
      "auth:checkSession",
      (): Promise<SessionCheckResult> => this.checkSession(),
    );
    ipcMain.handle("auth:logout", (): Promise<LogoutResult> => this.logout());
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
      return {
        ok: true,
        user: this.userMapper.toDTO(user),
        tokenStorageWarning,
      };
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

  private async checkSession(): Promise<SessionCheckResult> {
    try {
      const output = await this.checkSessionUseCase.execute();
      return output.status === "authenticated"
        ? {
            status: "authenticated",
            user: this.userMapper.toDTO(output.user),
          }
        : { status: "no_token" };
    } catch (error) {
      return {
        status: "error",
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async logout(): Promise<LogoutResult> {
    try {
      await this.logoutUseCase.execute();
      return { ok: true };
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
