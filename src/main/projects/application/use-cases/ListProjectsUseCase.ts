import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { ITaskGateway } from "../../../tasks/application/ports/ITaskGateway";
import type { Project } from "../../domain/entities/Project";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import { ProjectMapper } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";

export class ListProjectsUseCase implements UseCase<void, Project[]> {
  constructor(
    private readonly projectGateway: IProjectGateway,
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(): Promise<Project[]> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidProjectSessionError();

    const rawProjects = await this.projectGateway.listProjects(
      accessToken.value,
    );
    const mapper = new ProjectMapper();

    return Promise.all(
      rawProjects.map(async (raw) => {
        const activeTaskCount = await this.countActiveTasks(
          accessToken.value,
          raw.id,
        );
        return mapper.toDomain(raw, activeTaskCount);
      }),
    );
  }

  /** "Active" here means Todoist-incomplete — `getTasks` never returns
   * completed tasks, so a full page walk is enough (see `CountUnfinishedTasksUseCase`). */
  private async countActiveTasks(
    accessToken: string,
    projectId: string,
  ): Promise<number> {
    let count = 0;
    let cursor: string | null = null;
    do {
      const page = await this.taskGateway.listTasks(
        accessToken,
        cursor,
        projectId,
      );
      count += page.tasks.length;
      cursor = page.nextCursor;
    } while (cursor !== null);
    return count;
  }
}
