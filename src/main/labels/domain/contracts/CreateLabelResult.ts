import type { LabelDTO } from "../dtos/LabelDTO";
import type { LabelsFailure } from "./LabelsFailure";

export type CreateLabelResult = { ok: true; label: LabelDTO } | LabelsFailure;
