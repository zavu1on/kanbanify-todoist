import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { Project } from "../../domain/entities/Project";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import { ProjectMapper } from "../../domain/mappers/ProjectMapper";
import type { CreateProjectInput } from "../dtos/CreateProjectInput";
import type { IProjectGateway } from "../ports/IProjectGateway";

export class CreateProjectUseCase
  implements UseCase<CreateProjectInput, Project>
{
  private readonly projectMapper = new ProjectMapper();

  constructor(
    private readonly projectGateway: IProjectGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidProjectSessionError();

    // Validation (name length/emptiness) happens inside `Project.create` —
    // it throws `InvalidProjectNameError` before any port call is made.
    const project = Project.create({
      name: input.name,
      description: input.description,
      color: input.color,
      parentId: input.parentId,
    });

    const raw = await this.projectGateway.create(accessToken.value, project);
    // A brand-new project has no tasks yet — no need to round-trip through
    // the task gateway just to confirm a count of zero.
    return this.projectMapper.toDomain(raw, 0);
  }
}
