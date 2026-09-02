export class UpdateFilterInput {
  constructor(
    readonly id: number,
    readonly title: string,
    readonly color: string,
    readonly query: string,
  ) {}
}
