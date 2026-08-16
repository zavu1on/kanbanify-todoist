import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import type { GetAutoLaunchStatusUseCase } from "../application/use-cases/GetAutoLaunchStatusUseCase";
import type { SetAutoLaunchStatusUseCase } from "../application/use-cases/SetAutoLaunchStatusUseCase";
import type { AutoLaunchStatusResult } from "../domain/contracts/AutoLaunchStatusResult";
import { AutoLaunchError } from "../domain/errors/AutoLaunchError";

export class StartupIpcController implements IpcController {
  constructor(
    private readonly getAutoLaunchStatusUseCase: GetAutoLaunchStatusUseCase,
    private readonly setAutoLaunchStatusUseCase: SetAutoLaunchStatusUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "startup:getAutoLaunch",
      (): Promise<AutoLaunchStatusResult> => this.getAutoLaunch(),
    );
    ipcMain.handle(
      "startup:setAutoLaunch",
      (_event, enabled: unknown): Promise<AutoLaunchStatusResult> =>
        this.setAutoLaunch(enabled === true),
    );
  }

  private async getAutoLaunch(): Promise<AutoLaunchStatusResult> {
    try {
      const enabled = await this.getAutoLaunchStatusUseCase.execute();
      return { ok: true, enabled };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private async setAutoLaunch(
    enabled: boolean,
  ): Promise<AutoLaunchStatusResult> {
    try {
      const confirmedEnabled =
        await this.setAutoLaunchStatusUseCase.execute(enabled);
      return { ok: true, enabled: confirmedEnabled };
    } catch (error) {
      return this.toFailure(error);
    }
  }

  private toFailure(error: unknown): AutoLaunchStatusResult {
    return {
      ok: false,
      error: {
        type: "unknown",
        message: this.getMessageFromError(error),
      },
    };
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof AutoLaunchError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while updating startup settings";
  }
}
