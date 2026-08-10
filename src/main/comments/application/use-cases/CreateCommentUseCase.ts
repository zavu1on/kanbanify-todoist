import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Comment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { CreateCommentInput } from "../dtos/CreateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class CreateCommentUseCase
  implements UseCase<CreateCommentInput, Comment>
{
  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    // Validation (content emptiness) happens inside `Comment.create` — it
    // throws `InvalidCommentContentError` before any port call is made.
    const comment = Comment.create({
      taskId: input.taskId,
      content: input.content,
    });

    return this.commentGateway.create(accessToken.value, comment);
  }
}
