import { describe, expect, it, vi } from "vitest";
import { AuthenticatedUser } from "../../domain/entities/AuthenticatedUser";
import { AccessToken } from "../../domain/value-objects/AccessToken";
import type { ITodoistUserGateway } from "../ports/ITodoistUserGateway";
import type { ITokenStore } from "../ports/ITokenStore";
import { LoginUseCase } from "./LoginUseCase";

const parseToken = (rawValue: string): AccessToken => {
  const parsed = AccessToken.safeParse(rawValue);
  if (!parsed.success) throw new Error("invalid test token");
  return parsed.data;
};

describe("LoginUseCase", () => {
  it("fetches the user and stores the token, without a warning when encrypted", async () => {
    const user = new AuthenticatedUser(
      "1",
      "Jane Doe",
      "jane@example.com",
      null,
    );
    const userGateway: ITodoistUserGateway = {
      fetchCurrentUser: vi.fn().mockResolvedValue(user),
    };
    const tokenStore: ITokenStore = {
      save: vi.fn().mockResolvedValue({ encrypted: true }),
      load: vi.fn(),
      clear: vi.fn(),
    };
    const useCase = new LoginUseCase(userGateway, tokenStore);
    const token = parseToken("a".repeat(40));

    const output = await useCase.execute(token);

    expect(output).toEqual({ user, tokenStorageWarning: undefined });
    expect(userGateway.fetchCurrentUser).toHaveBeenCalledWith(token.value);
    expect(tokenStore.save).toHaveBeenCalledWith(token.value);
  });

  it("surfaces a storage warning when the token could not be encrypted", async () => {
    const user = new AuthenticatedUser(
      "1",
      "Jane Doe",
      "jane@example.com",
      null,
    );
    const userGateway: ITodoistUserGateway = {
      fetchCurrentUser: vi.fn().mockResolvedValue(user),
    };
    const tokenStore: ITokenStore = {
      save: vi.fn().mockResolvedValue({ encrypted: false }),
      load: vi.fn(),
      clear: vi.fn(),
    };
    const useCase = new LoginUseCase(userGateway, tokenStore);

    const output = await useCase.execute(parseToken("a".repeat(40)));

    expect(output.tokenStorageWarning).toBeDefined();
  });

  it("does not store the token when the gateway rejects it", async () => {
    const userGateway: ITodoistUserGateway = {
      fetchCurrentUser: vi.fn().mockRejectedValue(new Error("invalid token")),
    };
    const tokenStore: ITokenStore = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn(),
    };
    const useCase = new LoginUseCase(userGateway, tokenStore);

    await expect(useCase.execute(parseToken("a".repeat(40)))).rejects.toThrow(
      "invalid token",
    );
    expect(tokenStore.save).not.toHaveBeenCalled();
  });
});
