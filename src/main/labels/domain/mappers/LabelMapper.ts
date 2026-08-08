import type { LabelDTO } from "../dtos/LabelDTO";
import { Label } from "../entities/Label";

/** The subset of the Todoist API label shape this app reads — kept structural
 * (not the SDK's own type) so this mapper stays free of an SDK import. */
export type LabelApiSource = { id: string; name: string };

export class LabelMapper {
  toDomain(source: LabelApiSource): Label {
    return Label.reconstitute(source);
  }

  /** `name` is a prototype getter on `Label`, so Electron's IPC transport
   * (structured clone) would drop it — this is the plain shape that actually
   * survives the trip to the renderer. */
  toDTO(label: Label): LabelDTO {
    return { id: label.id, name: label.name };
  }
}
