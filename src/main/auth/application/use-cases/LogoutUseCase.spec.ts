import { describe, expect, it, vi } from "vitest";
import type { ITokenStore } from "../ports/ITokenStore";
import { LogoutUseCase } from "./LogoutUseCase";

describe("LogoutUseCase", () => {
  it("clears the stored token", async () => {
    const tokenStore: ITokenStore = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new LogoutUseCase(tokenStore);

    await useCase.execute();

    expect(tokenStore.clear).toHaveBeenCalledOnce();
  });

  it("propagates errors from the token store", async () => {
    const tokenStore: ITokenStore = {
      save: vi.fn(),
      load: vi.fn(),
      clear: vi.fn().mockRejectedValue(new Error("disk error")),
    };
    const useCase = new LogoutUseCase(tokenStore);

    await expect(useCase.execute()).rejects.toThrow("disk error");
  });
});
