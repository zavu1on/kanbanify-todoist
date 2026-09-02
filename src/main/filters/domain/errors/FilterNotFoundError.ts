import { FiltersError } from "./FiltersError";

export class FilterNotFoundError extends FiltersError {
  constructor(message = "Filter not found") {
    super(message);
  }
}
