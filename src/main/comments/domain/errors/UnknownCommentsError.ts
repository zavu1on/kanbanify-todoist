import { CommentsError } from "./CommentsError";

export class UnknownCommentsError extends CommentsError {
  constructor(message = "Unknown error while loading comments from Todoist") {
    super(message);
  }
}
