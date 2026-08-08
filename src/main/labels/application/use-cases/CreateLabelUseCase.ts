import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Label } from "../../domain/entities/Label";
import { InvalidLabelSessionError } from "../../domain/errors/InvalidLabelSessionError";
import type { CreateLabelInput } from "../dtos/CreateLabelInput";
import type { ILabelGateway } from "../ports/ILabelGateway";

export class CreateLabelUseCase implements UseCase<CreateLabelInput, Label> {
  constructor(
    private readonly labelGateway: ILabelGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CreateLabelInput): Promise<Label> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidLabelSessionError();

    // Validation (name emptiness) happens inside `Label.create` — it throws
    // `InvalidLabelNameError` before any port call is made.
    const label = Label.create({ name: input.name });

    return this.labelGateway.create(accessToken.value, label);
  }
}
