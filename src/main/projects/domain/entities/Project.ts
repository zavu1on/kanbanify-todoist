export class Project {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly color: string,
    readonly isInboxProject: boolean,
    readonly activeTaskCount: number,
  ) {}
}
