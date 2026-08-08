import { LabelsError } from "./LabelsError";

export class UnknownLabelsError extends LabelsError {
  constructor(message = "Unknown error while loading labels from Todoist") {
    super(message);
  }
}
