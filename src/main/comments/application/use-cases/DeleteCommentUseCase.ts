import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidCommentSessionError } from "../../domain/errors/InvalidCommentSessionError";
import type { ICommentGateway } from "../ports/ICommentGateway";

export class DeleteCommentUseCase implements UseCase<string, void> {
  constructor(
    private readonly commentGateway: ICommentGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(commentId: string): Promise<void> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidCommentSessionError();

    await this.commentGateway.delete(accessToken.value, commentId);
  }
}
