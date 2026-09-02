export class CreateFilterInput {
  constructor(
    readonly title: string,
    readonly color: string,
    readonly query: string,
  ) {}
}
