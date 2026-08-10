import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Comment } from "../../domain/entities/Comment";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { UpdateCommentInput } from "../dtos/UpdateCommentInput";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class UpdateCommentUseCase
  implements UseCase<UpdateCommentInput, Comment>
{
  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: UpdateCommentInput): Promise<Comment> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    const original = await this.commentGateway.getComment(
      accessToken.value,
      input.commentId,
    );
    // Content validation happens inside `Comment#update`.
    original.update(input.content);

    return this.commentGateway.save(accessToken.value, original);
  }
}
