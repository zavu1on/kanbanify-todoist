import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import type { Label } from "../../domain/entities/Label";
import { InvalidLabelNameError } from "../../domain/errors/InvalidLabelNameError";
import { InvalidLabelSessionError } from "../../domain/errors/InvalidLabelSessionError";
import { CreateLabelInput } from "../dtos/CreateLabelInput";
import type { ILabelGateway } from "../ports/ILabelGateway";
import { CreateLabelUseCase } from "./CreateLabelUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (): ILabelGateway => ({
  listLabels: vi.fn(),
  create: vi.fn().mockImplementation((_token, label: Label) => label),
});

const token = AccessToken.of("a-valid-token-value-000000000000");

describe("CreateLabelUseCase", () => {
  it("throws InvalidLabelSessionError when no token is stored", async () => {
    const useCase = new CreateLabelUseCase(
      buildGateway(),
      buildTokenStore(null),
    );

    await expect(
      useCase.execute(new CreateLabelInput("urgent")),
    ).rejects.toThrow(InvalidLabelSessionError);
  });

  it("builds a label from the entity factory and persists it via the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateLabelUseCase(gateway, buildTokenStore(token));

    const result = await useCase.execute(new CreateLabelInput("urgent"));

    expect(gateway.create).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
      expect.objectContaining({ id: "", name: "urgent" }),
    );
    expect(result.name).toBe("urgent");
  });

  it("throws InvalidLabelNameError for an empty name without calling the gateway", async () => {
    const gateway = buildGateway();
    const useCase = new CreateLabelUseCase(gateway, buildTokenStore(token));

    await expect(useCase.execute(new CreateLabelInput("   "))).rejects.toThrow(
      InvalidLabelNameError,
    );
    expect(gateway.create).not.toHaveBeenCalled();
  });
});
