export class CreateProjectInput {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly color: string,
    readonly parentId: string | null,
  ) {}
}
