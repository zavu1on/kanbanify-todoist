import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import type { Project } from "../../domain/entities/Project";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import { ProjectMapper } from "../../domain/mappers/ProjectMapper";
import type { UpdateProjectInput } from "../dtos/UpdateProjectInput";
import type { IProjectGateway } from "../ports/IProjectGateway";

export class UpdateProjectUseCase
  implements UseCase<UpdateProjectInput, Project>
{
  private readonly projectMapper = new ProjectMapper();

  constructor(
    private readonly projectGateway: IProjectGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: UpdateProjectInput): Promise<Project> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidProjectSessionError();

    const raw = await this.projectGateway.getProject(
      accessToken.value,
      input.id,
    );
    // `activeTaskCount` is display-only and never sent back to Todoist —
    // 0 is a harmless stand-in here (see `CreateProjectUseCase`).
    const project = this.projectMapper.toDomain(raw, 0);

    // Mutates `project` in place and validates the new name — throws
    // `InvalidProjectNameError` before any save call is made.
    project.updateDetails({
      name: input.name,
      description: input.description,
      color: input.color,
    });

    const savedRaw = await this.projectGateway.save(accessToken.value, project);
    return this.projectMapper.toDomain(savedRaw, 0);
  }
}
