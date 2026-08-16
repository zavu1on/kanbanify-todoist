import { app } from "electron";
import type { IAutoLaunchGateway } from "../application/ports/IAutoLaunchGateway";
import { AUTO_LAUNCH_HIDDEN_ARG } from "../domain/constants/AutoLaunchHiddenArg";
import { UnknownAutoLaunchError } from "../domain/errors/UnknownAutoLaunchError";

export class ElectronAutoLaunchGateway implements IAutoLaunchGateway {
  isEnabled(): boolean {
    try {
      // Electron matches the login item by exact `path` + `args`, defaulting
      // `args` to `[]` — since `setEnabled` always registers with
      // `AUTO_LAUNCH_HIDDEN_ARG`, checking without it here would never match
      // the registered entry and `openAtLogin` would read back `false` even
      // right after enabling.
      return app.getLoginItemSettings({ args: [AUTO_LAUNCH_HIDDEN_ARG] })
        .openAtLogin;
    } catch (error) {
      throw this.wrap(error);
    }
  }

  setEnabled(enabled: boolean): void {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        args: enabled ? [AUTO_LAUNCH_HIDDEN_ARG] : [],
      });
    } catch (error) {
      throw this.wrap(error);
    }
  }

  private wrap(error: unknown): UnknownAutoLaunchError {
    return new UnknownAutoLaunchError(
      error instanceof Error
        ? error.message
        : "Unknown error while updating the OS login item",
    );
  }
}
