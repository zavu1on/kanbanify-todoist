import type { Label } from "../../domain/entities/Label";

export interface ILabelGateway {
  /** @throws {import("../../domain/errors/LabelsError").LabelsError} */
  listLabels(accessToken: string): Promise<Label[]>;

  /** @throws {import("../../domain/errors/LabelsError").LabelsError} */
  create(accessToken: string, label: Label): Promise<Label>;
}
