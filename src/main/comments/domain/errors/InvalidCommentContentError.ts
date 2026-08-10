import { CommentsError } from "./CommentsError";

export class InvalidCommentContentError extends CommentsError {
  constructor(message = "Invalid comment content") {
    super(message);
  }
}
