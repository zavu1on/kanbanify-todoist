import { TasksError } from "./TasksError";

export class TaskAlreadyCompletedError extends TasksError {
  constructor(message = "This task is already completed") {
    super(message);
  }
}
