/**
 * Public API of the `labels` module — the only surface other processes see.
 */

export type { CreateLabelRequest } from "./domain/contracts/CreateLabelRequest";
export type { CreateLabelResult } from "./domain/contracts/CreateLabelResult";
export type { LabelsErrorType } from "./domain/contracts/LabelsFailure";
export type { LabelsListResult } from "./domain/contracts/LabelsListResult";
export type { LabelDTO } from "./domain/dtos/LabelDTO";
export { labelNameSchema } from "./domain/value-objects/LabelName";
