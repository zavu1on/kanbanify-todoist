import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { ITaskGateway } from "../../../tasks/application/ports/ITaskGateway";
import type { Project } from "../../domain/entities/Project";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import { ProjectMapper } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";
import { countActiveTasksInProject } from "../services/countActiveTasksInProject";

export class GetProjectUseCase implements UseCase<string, Project> {
  private readonly projectMapper = new ProjectMapper();

  constructor(
    private readonly projectGateway: IProjectGateway,
    private readonly taskGateway: ITaskGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(projectId: string): Promise<Project> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidProjectSessionError();

    const raw = await this.projectGateway.getProject(
      accessToken.value,
      projectId,
    );
    const activeTaskCount = await countActiveTasksInProject(
      this.taskGateway,
      accessToken.value,
      projectId,
    );

    return this.projectMapper.toDomain(raw, activeTaskCount);
  }
}
