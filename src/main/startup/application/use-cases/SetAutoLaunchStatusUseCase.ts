import type { UseCase } from "../../../shared/UseCase";
import type { IAutoLaunchGateway } from "../ports/IAutoLaunchGateway";

export class SetAutoLaunchStatusUseCase implements UseCase<boolean, boolean> {
  constructor(private readonly autoLaunchGateway: IAutoLaunchGateway) {}

  // Reads the state back from the OS instead of trusting `enabled` — the
  // gateway is the source of truth the renderer's toggle stays in sync with.
  async execute(enabled: boolean): Promise<boolean> {
    this.autoLaunchGateway.setEnabled(enabled);
    return this.autoLaunchGateway.isEnabled();
  }
}
