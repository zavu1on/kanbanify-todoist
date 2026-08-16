import type { UseCase } from "../../../shared/UseCase";
import type { IAutoLaunchGateway } from "../ports/IAutoLaunchGateway";

export class GetAutoLaunchStatusUseCase implements UseCase<void, boolean> {
  constructor(private readonly autoLaunchGateway: IAutoLaunchGateway) {}

  async execute(): Promise<boolean> {
    return this.autoLaunchGateway.isEnabled();
  }
}
