export class UpdateCommentInput {
  constructor(
    readonly commentId: string,
    readonly content: string,
  ) {}
}
