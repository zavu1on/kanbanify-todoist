import { FiltersError } from "./FiltersError";

export class InvalidFilterSessionError extends FiltersError {
  constructor(message = "No active Todoist session") {
    super(message);
  }
}
