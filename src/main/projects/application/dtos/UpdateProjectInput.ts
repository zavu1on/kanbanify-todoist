export class UpdateProjectInput {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
    readonly color: string,
  ) {}
}
