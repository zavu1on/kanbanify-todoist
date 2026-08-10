import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Comment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class ListCommentsUseCase implements UseCase<string, Comment[]> {
  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(taskId: string): Promise<Comment[]> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    return this.commentGateway.listComments(accessToken.value, taskId);
  }
}
