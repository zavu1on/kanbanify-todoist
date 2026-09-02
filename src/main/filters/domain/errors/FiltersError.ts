export abstract class FiltersError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
