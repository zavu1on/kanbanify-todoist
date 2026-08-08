import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../../../auth/application/ports/ITokenStore";
import { AccessToken } from "../../../auth/domain/value-objects/AccessToken";
import { Label } from "../../domain/entities/Label";
import { InvalidLabelSessionError } from "../../domain/errors/InvalidLabelSessionError";
import type { ILabelGateway } from "../ports/ILabelGateway";
import { ListLabelsUseCase } from "./ListLabelsUseCase";

const buildTokenStore = (accessToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(accessToken),
  clear: vi.fn(),
});

const buildGateway = (labels: Label[]): ILabelGateway => ({
  listLabels: vi.fn().mockResolvedValue(labels),
  create: vi.fn(),
});

describe("ListLabelsUseCase", () => {
  it("throws InvalidLabelSessionError when no token is stored", async () => {
    const useCase = new ListLabelsUseCase(
      buildGateway([]),
      buildTokenStore(null),
    );

    await expect(useCase.execute()).rejects.toThrow(InvalidLabelSessionError);
  });

  it("forwards the token and returns the gateway's labels", async () => {
    const labels = [Label.reconstitute({ id: "1", name: "urgent" })];
    const gateway = buildGateway(labels);
    const useCase = new ListLabelsUseCase(
      gateway,
      buildTokenStore(AccessToken.of("a-valid-token-value-000000000000")),
    );

    const result = await useCase.execute();

    expect(gateway.listLabels).toHaveBeenCalledWith(
      "a-valid-token-value-000000000000",
    );
    expect(result).toBe(labels);
  });
});
