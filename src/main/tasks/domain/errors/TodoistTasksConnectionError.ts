import { TasksError } from "./TasksError";

export class TodoistTasksConnectionError extends TasksError {
  constructor(
    message = "Could not connect to Todoist. Check your internet connection and try again",
  ) {
    super(message);
  }
}
