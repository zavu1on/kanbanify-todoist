import type { LabelDTO } from "../dtos/LabelDTO";
import type { LabelsFailure } from "./LabelsFailure";

export type LabelsListResult = { ok: true; labels: LabelDTO[] } | LabelsFailure;
