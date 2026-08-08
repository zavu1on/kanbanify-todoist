import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Label } from "../../domain/entities/Label";
import { InvalidLabelSessionError } from "../../domain/errors/InvalidLabelSessionError";
import type { ILabelGateway } from "../ports/ILabelGateway";

export class ListLabelsUseCase implements UseCase<void, Label[]> {
  constructor(
    private readonly labelGateway: ILabelGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(): Promise<Label[]> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidLabelSessionError();

    return this.labelGateway.listLabels(accessToken.value);
  }
}
