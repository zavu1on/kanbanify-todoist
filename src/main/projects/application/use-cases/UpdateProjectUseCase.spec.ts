import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InvalidProjectNameError } from "../../domain/errors/InvalidProjectNameError";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";
import { UpdateProjectInput } from "../dtos/UpdateProjectInput";
import { UpdateProjectUseCase } from "./UpdateProjectUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const existingRaw: ProjectApiSource = {
  id: "1",
  name: "Work",
  description: "Old description",
  color: "blue",
  parentId: "parent-1",
  isInboxProject: false,
  isArchived: false,
};

const buildProjectGateway = (savedRaw: ProjectApiSource): IProjectGateway => ({
  listProjects: vi.fn(),
  getProject: vi.fn().mockResolvedValue(existingRaw),
  create: vi.fn(),
  save: vi.fn().mockResolvedValue(savedRaw),
  archive: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("UpdateProjectUseCase", () => {
  it("throws InvalidProjectSessionError when no token is stored", async () => {
    const useCase = new UpdateProjectUseCase(
      buildProjectGateway(existingRaw),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new UpdateProjectInput("1", "Work", "", "blue")),
    ).rejects.toThrow(InvalidProjectSessionError);
  });

  it("throws InvalidProjectNameError for a blank name after loading, without saving the project", async () => {
    const projectGateway = buildProjectGateway(existingRaw);
    const useCase = new UpdateProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    await expect(
      useCase.execute(new UpdateProjectInput("1", "  ", "", "blue")),
    ).rejects.toThrow(InvalidProjectNameError);
    // Validation lives on `Project.updateDetails`, called after the entity
    // is loaded — so `getProject` still runs, only `save` is skipped.
    expect(projectGateway.getProject).toHaveBeenCalledWith(token.value, "1");
    expect(projectGateway.save).not.toHaveBeenCalled();
  });

  it("loads the project, applies the new details and saves the result, keeping the parent unchanged", async () => {
    const savedRaw: ProjectApiSource = {
      ...existingRaw,
      name: "Renamed",
      description: "New description",
      color: "red",
    };
    const projectGateway = buildProjectGateway(savedRaw);
    const useCase = new UpdateProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    const project = await useCase.execute(
      new UpdateProjectInput("1", " Renamed ", " New description ", "red"),
    );

    expect(projectGateway.getProject).toHaveBeenCalledWith(token.value, "1");
    const savedProject = (projectGateway.save as ReturnType<typeof vi.fn>).mock
      .calls[0][1];
    expect(savedProject.name).toBe("Renamed");
    expect(savedProject.description).toBe("New description");
    expect(savedProject.color).toBe("red");
    expect(savedProject.parentId).toBe("parent-1");
    expect(project.name).toBe("Renamed");
  });
});
