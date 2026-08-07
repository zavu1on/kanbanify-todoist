import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidProjectNameError } from "../../domain/errors/InvalidProjectNameError";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";
import { CreateProjectInput } from "../dtos/CreateProjectInput";
import type { IProjectGateway } from "../ports/IProjectGateway";
import { CreateProjectUseCase } from "./CreateProjectUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildProjectGateway = (raw: ProjectApiSource): IProjectGateway => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  create: vi.fn().mockResolvedValue(raw),
  save: vi.fn(),
  archive: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

const createdRaw: ProjectApiSource = {
  id: "1",
  name: "Work",
  description: "Work stuff",
  color: "blue",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
};

describe("CreateProjectUseCase", () => {
  it("throws InvalidProjectSessionError when no token is stored", async () => {
    const useCase = new CreateProjectUseCase(
      buildProjectGateway(createdRaw),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new CreateProjectInput("Work", "", "blue", null)),
    ).rejects.toThrow(InvalidProjectSessionError);
  });

  it("throws InvalidProjectNameError for a blank name without calling the gateway", async () => {
    const projectGateway = buildProjectGateway(createdRaw);
    const useCase = new CreateProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(new CreateProjectInput("   ", "", "blue", null)),
    ).rejects.toThrow(InvalidProjectNameError);
    expect(projectGateway.create).not.toHaveBeenCalled();
  });

  it("creates the project with the trimmed name and description, and a zero task count", async () => {
    const projectGateway = buildProjectGateway(createdRaw);
    const useCase = new CreateProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    const project = await useCase.execute(
      new CreateProjectInput("  Work  ", "  Work stuff  ", "blue", "parent-1"),
    );

    // `Project`'s mutable fields are private (see BACKEND_CODE_STYLE_GUIDE.md
    // "Naming и структура кода"), so the call argument is asserted through its
    // getters rather than deep-equaled against a plain object.
    expect(projectGateway.create).toHaveBeenCalledTimes(1);
    const createdProject = (projectGateway.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][1];
    expect(createdProject.id).toBe("");
    expect(createdProject.name).toBe("Work");
    expect(createdProject.description).toBe("Work stuff");
    expect(createdProject.color).toBe("blue");
    expect(createdProject.parentId).toBe("parent-1");

    expect(project.activeTaskCount).toBe(0);
    expect(project.name).toBe("Work");
  });
});
