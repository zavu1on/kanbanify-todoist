import { ipcMain } from "electron";
import type { IpcController } from "../../shared/IpcController";
import { CreateCommentInput } from "../application/dtos/CreateCommentInput";
import { UpdateCommentInput } from "../application/dtos/UpdateCommentInput";
import type { CreateCommentUseCase } from "../application/use-cases/CreateCommentUseCase";
import type { DeleteCommentUseCase } from "../application/use-cases/DeleteCommentUseCase";
import type { ListCommentsUseCase } from "../application/use-cases/ListCommentsUseCase";
import type { UpdateCommentUseCase } from "../application/use-cases/UpdateCommentUseCase";
import type { CommentsErrorType } from "../domain/contracts/CommentsFailure";
import type { CommentsListResult } from "../domain/contracts/CommentsListResult";
import type { CreateCommentRequest } from "../domain/contracts/CreateCommentRequest";
import type { CreateCommentResult } from "../domain/contracts/CreateCommentResult";
import type { DeleteCommentResult } from "../domain/contracts/DeleteCommentResult";
import type { UpdateCommentRequest } from "../domain/contracts/UpdateCommentRequest";
import type { UpdateCommentResult } from "../domain/contracts/UpdateCommentResult";
import { CommentsError } from "../domain/errors/CommentsError";
import { InvalidCommentContentError } from "../domain/errors/InvalidCommentContentError";
import { InvalidCommentSessionError } from "../domain/errors/InvalidCommentSessionError";
import { TodoistCommentsConnectionError } from "../domain/errors/TodoistCommentsConnectionError";
import { CommentMapper } from "../domain/mappers/CommentMapper";

export class CommentsIpcController implements IpcController {
  private readonly commentMapper = new CommentMapper();

  constructor(
    private readonly listCommentsUseCase: ListCommentsUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  register(): void {
    ipcMain.handle(
      "comments:list",
      (_event, taskId: unknown): Promise<CommentsListResult> =>
        this.list(taskId),
    );
    ipcMain.handle(
      "comments:create",
      (_event, input: CreateCommentRequest): Promise<CreateCommentResult> =>
        this.create(input),
    );
    ipcMain.handle(
      "comments:update",
      (
        _event,
        commentId: unknown,
        input: UpdateCommentRequest,
      ): Promise<UpdateCommentResult> => this.update(commentId, input),
    );
    ipcMain.handle(
      "comments:delete",
      (_event, commentId: unknown): Promise<DeleteCommentResult> =>
        this.delete(commentId),
    );
  }

  private async list(taskId: unknown): Promise<CommentsListResult> {
    if (typeof taskId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid comments list request" },
      };
    }

    try {
      const comments = await this.listCommentsUseCase.execute(taskId);
      return {
        ok: true,
        comments: comments.map((comment) => this.commentMapper.toDTO(comment)),
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async create(
    input: CreateCommentRequest,
  ): Promise<CreateCommentResult> {
    try {
      const comment = await this.createCommentUseCase.execute(
        new CreateCommentInput(input.taskId, input.content),
      );
      return { ok: true, comment: this.commentMapper.toDTO(comment) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async update(
    commentId: unknown,
    input: UpdateCommentRequest,
  ): Promise<UpdateCommentResult> {
    if (typeof commentId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid comment update request" },
      };
    }

    try {
      const comment = await this.updateCommentUseCase.execute(
        new UpdateCommentInput(commentId, input.content),
      );
      return { ok: true, comment: this.commentMapper.toDTO(comment) };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private async delete(commentId: unknown): Promise<DeleteCommentResult> {
    if (typeof commentId !== "string") {
      return {
        ok: false,
        error: { type: "unknown", message: "Invalid comment delete request" },
      };
    }

    try {
      await this.deleteCommentUseCase.execute(commentId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: this.getErrorType(error),
          message: this.getMessageFromError(error),
        },
      };
    }
  }

  private getErrorType(error: unknown): CommentsErrorType {
    if (error instanceof InvalidCommentSessionError) return "auth_error";
    if (error instanceof TodoistCommentsConnectionError) return "network_error";
    if (error instanceof InvalidCommentContentError) return "invalid_content";
    return "unknown";
  }

  private getMessageFromError(error: unknown): string {
    if (error instanceof CommentsError) return error.message;
    return error instanceof Error
      ? error.message
      : "Unknown error while loading comments";
  }
}
