import { TasksError } from "./TasksError";

export class InvalidTaskTitleError extends TasksError {
  constructor(message = "Invalid task title") {
    super(message);
  }
}
