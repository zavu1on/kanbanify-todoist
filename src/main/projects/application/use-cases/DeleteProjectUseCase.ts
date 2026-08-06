import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import type { UseCase } from "../../../shared/UseCase";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import { ProjectMapper } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";

export class DeleteProjectUseCase implements UseCase<string, void> {
  private readonly projectMapper = new ProjectMapper();

  constructor(
    private readonly projectGateway: IProjectGateway,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(projectId: string): Promise<void> {
    const accessToken = await this.tokenStore.load();
    if (accessToken === null) throw new InvalidProjectSessionError();

    const raw = await this.projectGateway.getProject(
      accessToken.value,
      projectId,
    );
    const project = this.projectMapper.toDomain(raw, 0);
    // Validates the Inbox-protection invariant before the irreversible call.
    project.delete();

    await this.projectGateway.delete(accessToken.value, projectId);
  }
}
