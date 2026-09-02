import { FiltersError } from "./FiltersError";

export class InvalidFilterTitleError extends FiltersError {
  constructor(message = "Invalid filter title") {
    super(message);
  }
}
