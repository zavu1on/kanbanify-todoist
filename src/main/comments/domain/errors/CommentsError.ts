export abstract class CommentsError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
