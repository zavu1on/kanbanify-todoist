import { LabelsError } from "./LabelsError";

export class InvalidLabelNameError extends LabelsError {
  constructor(message = "Invalid label name") {
    super(message);
  }
}
