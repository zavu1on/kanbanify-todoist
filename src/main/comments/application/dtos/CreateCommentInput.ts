export class CreateCommentInput {
  constructor(
    readonly taskId: string,
    readonly content: string,
  ) {}
}
