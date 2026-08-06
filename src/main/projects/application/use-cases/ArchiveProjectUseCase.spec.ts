import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { InboxProjectProtectedError } from "../../domain/errors/InboxProjectProtectedError";
import { InvalidProjectSessionError } from "../../domain/errors/InvalidProjectSessionError";
import type { ProjectApiSource } from "../../domain/mappers/ProjectMapper";
import type { IProjectGateway } from "../ports/IProjectGateway";
import { ArchiveProjectUseCase } from "./ArchiveProjectUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildProjectGateway = (raw: ProjectApiSource): IProjectGateway => ({
  listProjects: vi.fn(),
  getProject: vi.fn().mockResolvedValue(raw),
  create: vi.fn(),
  save: vi.fn(),
  archive: vi.fn(),
  delete: vi.fn(),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

const regularRaw: ProjectApiSource = {
  id: "1",
  name: "Work",
  description: "",
  color: "blue",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
};

describe("ArchiveProjectUseCase", () => {
  it("throws InvalidProjectSessionError when no token is stored", async () => {
    const useCase = new ArchiveProjectUseCase(
      buildProjectGateway(regularRaw),
      buildTokenStore(null),
    );

    await expect(useCase.execute("1")).rejects.toThrow(
      InvalidProjectSessionError,
    );
  });

  it("loads the project and archives it through the gateway", async () => {
    const projectGateway = buildProjectGateway(regularRaw);
    const useCase = new ArchiveProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    await useCase.execute("1");

    expect(projectGateway.getProject).toHaveBeenCalledWith(token.value, "1");
    expect(projectGateway.archive).toHaveBeenCalledWith(token.value, "1");
  });

  it("throws InboxProjectProtectedError and never calls the gateway's archive for the Inbox project", async () => {
    const projectGateway = buildProjectGateway({
      ...regularRaw,
      isInboxProject: true,
    });
    const useCase = new ArchiveProjectUseCase(
      projectGateway,
      buildTokenStore(token),
    );

    await expect(useCase.execute("1")).rejects.toThrow(
      InboxProjectProtectedError,
    );
    expect(projectGateway.archive).not.toHaveBeenCalled();
  });
});
