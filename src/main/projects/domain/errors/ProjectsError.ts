export abstract class ProjectsError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
