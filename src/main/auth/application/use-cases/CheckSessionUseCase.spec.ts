import { describe, expect, it, vi } from "vitest";
import { AuthenticatedUser } from "../../domain/entities/AuthenticatedUser";
import { InvalidAccessTokenError } from "../../domain/errors/InvalidAccessTokenError";
import { AccessToken } from "../../domain/value-objects/AccessToken";
import type { ITodoistUserGateway } from "../ports/ITodoistUserGateway";
import type { ITokenStore } from "../ports/ITokenStore";
import { CheckSessionUseCase } from "./CheckSessionUseCase";

const buildTokenStore = (storedToken: AccessToken | null): ITokenStore => ({
  save: vi.fn(),
  load: vi.fn().mockResolvedValue(storedToken),
  clear: vi.fn(),
});

describe("CheckSessionUseCase", () => {
  it("returns no_token without calling the gateway when nothing is stored", async () => {
    const userGateway: ITodoistUserGateway = { fetchCurrentUser: vi.fn() };
    const useCase = new CheckSessionUseCase(userGateway, buildTokenStore(null));

    await expect(useCase.execute()).resolves.toEqual({ status: "no_token" });
    expect(userGateway.fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("returns authenticated with the fetched user when the stored token is valid", async () => {
    const user = new AuthenticatedUser(
      "1",
      "Jane Doe",
      "jane@example.com",
      null,
    );
    const userGateway: ITodoistUserGateway = {
      fetchCurrentUser: vi.fn().mockResolvedValue(user),
    };
    const useCase = new CheckSessionUseCase(
      userGateway,
      buildTokenStore(AccessToken.of("stored-token")),
    );

    await expect(useCase.execute()).resolves.toEqual({
      status: "authenticated",
      user,
    });
    expect(userGateway.fetchCurrentUser).toHaveBeenCalledWith("stored-token");
  });

  it("propagates the gateway's error when the stored token is no longer valid", async () => {
    const userGateway: ITodoistUserGateway = {
      fetchCurrentUser: vi
        .fn()
        .mockRejectedValue(new InvalidAccessTokenError()),
    };
    const useCase = new CheckSessionUseCase(
      userGateway,
      buildTokenStore(AccessToken.of("stored-token")),
    );

    await expect(useCase.execute()).rejects.toBeInstanceOf(
      InvalidAccessTokenError,
    );
  });
});
