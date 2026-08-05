import { TasksError } from "./TasksError";

export class UnknownTasksError extends TasksError {
  constructor(message = "Unknown error while loading tasks from Todoist") {
    super(message);
  }
}
