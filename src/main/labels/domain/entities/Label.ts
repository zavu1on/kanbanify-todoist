import { InvalidLabelNameError } from "../errors/InvalidLabelNameError";
import { LabelName } from "../value-objects/LabelName";

export type LabelCreateDetails = { name: string };
export type LabelReconstituteSource = { id: string; name: string };

export class Label {
  private constructor(
    readonly id: string,
    private readonly _name: LabelName,
  ) {}

  get name(): string {
    return this._name.value;
  }

  /** Factory for a label that doesn't exist in Todoist yet — `id` is empty
   * until `ILabelGateway.create` resolves with the real, API-assigned one. */
  static create(details: LabelCreateDetails): Label {
    return new Label("", Label.parseName(details.name));
  }

  /** Rebuilds a label from already-trusted data (a mapped API response) —
   * does not re-validate, unlike `create`. */
  static reconstitute(source: LabelReconstituteSource): Label {
    return new Label(source.id, LabelName.of(source.name));
  }

  private static parseName(rawName: string): LabelName {
    const result = LabelName.safeParse(rawName);
    if (!result.success) throw new InvalidLabelNameError(result.error);
    return result.data;
  }
}
